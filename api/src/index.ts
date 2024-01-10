import express from 'express';
import bodyParser from 'body-parser';
import type {VerifiedAuthenticationResponse, VerifiedRegistrationResponse, VerifyAuthenticationResponseOpts} from '@simplewebauthn/server';
import {generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse} from '@simplewebauthn/server';
import { isoBase64URL, isoUint8Array } from '@simplewebauthn/server/helpers';
import cors from 'cors'
import {faker} from '@faker-js/faker';

import {getRegistrationInfo, getNewChallenge, convertChallenge, findUser} from './utils';

// CONST
const RP_NAME = 'PROBIT passkey test';
const RP_ID = 'localhost';
const FRONTEND_PORT = '3000';
const EXPECTED_ORIGIN = `http://${RP_ID}:${FRONTEND_PORT}`;
const PORT = 3005;
const REQUIRE_USER_VERIFICATION = false; // TODO: In prod -> requireUserVerification = true
// DB
const users = {};
// SESSION
const challenges = {};

const app = express();

app.use(cors({origin: '*'}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// app.use(express.static(path.join(__dirname, '../../passkey-web/public')));
// app.get('/', (req, res) => {
//     return res.sendFile(path.join(__dirname, '../../passkey-web/public/index.html'));
// });

app.get('/db', (req, res) => {
    console.log(`====== users ======`);
    console.log(users);
    console.log(`====== challenges ======`);
    console.log(challenges);

    return res.json({data: {users, challenges}});
})

app.post('/register/start', async (req, res) => {
    const userId = req.body.id;
    const userName = faker.person.firstName();

    let challenge = getNewChallenge();
    challenges[userId] = convertChallenge(challenge);

    const registrationOptions = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userID: userId,
        userName: userName,
        timeout: 600 * 1000,
        attestationType: 'none',
        challenge: challenge,
        userDisplayName: userName,
        authenticatorSelection: {
            residentKey: 'discouraged',
            userVerification: 'preferred',  // https://passkeys.dev/docs/use-cases/bootstrapping/#a-note-about-user-verification
        },
        supportedAlgorithmIDs: [-7, -257],  // ES256, and RS256
    });

    return res.json({data: registrationOptions});
})

app.post('/register/finish', async (req, res) => {
    const userId = req.body.id;
    const data = req.body.data;

    // Verify the attestation response
    let verification: VerifiedRegistrationResponse = null;
    try {
        verification = await verifyRegistrationResponse({
            response: data,
            expectedChallenge: challenges[userId],
            expectedOrigin: EXPECTED_ORIGIN,
            requireUserVerification: REQUIRE_USER_VERIFICATION
        });
    } catch (err) {
        console.error(err);
        return res.status(400).send({error: err.toString()});
    }

    const {verified, registrationInfo} = verification;
    if (verified) {
        users[userId] = getRegistrationInfo(registrationInfo);
        return res.json({data: true});
    }
    
    return res.status(500).json({data: false});
})

app.post('/login/start', async (req, res) => {
    const userId = req.body.id;
    let user;
    try {
        user = findUser(users, userId);
    } catch (err) {
        console.log(err.toString());
        return res.status(400).send({error: 'invalid_user'});
    }

    let challenge = getNewChallenge();
    challenges[user.name] = convertChallenge(challenge);

    const authenticationOptions = await generateAuthenticationOptions({
        rpID: RP_ID,
        timeout: 600 * 1000,
        allowCredentials: [
            {
                id: user['credentialID'],
                type: 'public-key',
                // transports: ['ble', 'cable', 'hybrid', 'internal', 'nfc', 'smart-card', 'usb'],
            }
        ],
        userVerification: 'preferred',
    });

    return res.json({data: authenticationOptions});
})

app.post('/login/finish', async (req, res) => {
    const userId = req.body.id;
    const data = req.body.data;

    let user;
    try {
        user = findUser(users, userId);
    } catch (err) {
        return res.status(400).send({error: 'invalid_user'});
    }
    
    let dbAuthenticator;
    const bodyCredIDBuffer = isoBase64URL.toBuffer(data.rawId);
    const userCredentialId = user['credentialID'];
    // "Query the DB" here for an authenticator matching `credentialID`
    if (isoUint8Array.areEqual(userCredentialId, bodyCredIDBuffer)) {
        dbAuthenticator = user[userId];
    }

    if (!dbAuthenticator) {
        return res.status(400).send({error: 'invalid_auth'});
    }
  
    let verification: VerifiedAuthenticationResponse;
    try {
        const opts: VerifyAuthenticationResponseOpts = {
            response: data,
            expectedChallenge: challenges[userId],
            expectedOrigin: EXPECTED_ORIGIN,
            expectedRPID: RP_ID,
            authenticator: dbAuthenticator,
            requireUserVerification: REQUIRE_USER_VERIFICATION,
        };
        verification = await verifyAuthenticationResponse(opts);
    } catch (err) {
        console.log(err.toString());
        return res.status(400).send({error: err.toString()});
    }
  
    const {verified, authenticationInfo} = verification;
  
    if (verified) {
        // Update the authenticator's counter in the DB to the newest count in the authentication
        dbAuthenticator.counter = authenticationInfo.newCounter;
    }
})

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
