import {useState} from 'react';
import axios from 'axios';
import {BASE_URL, USER_ID} from '../Utils/env';
import type {PublicKeyCredentialCreationOptionsJSON, RegistrationResponseJSON} from '@simplewebauthn/typescript-types';
import {startRegistration} from '@simplewebauthn/browser';
import { getDb } from '../Utils/functions';



export default function Register () {
    const [registration, setRegistration] = useState<RegistrationResponseJSON>();

    async function registerStart () {
        try {
            const result = await axios.post<{data: PublicKeyCredentialCreationOptionsJSON}>(`${BASE_URL}/register/start`, {
                id: USER_ID,
            });

            const registrationOptions = result.data.data;

            const registration = await startRegistration(registrationOptions);

            setRegistration(registration);
            alert('등록 시작');
        } catch (err: any) {
            alert(`등록 실패 : ${err.toString()}`)
        }

    }

    async function registerFinish () {
        try {
            const result = await axios.post<{data: boolean}>(`${BASE_URL}/register/finish`, {
                id: USER_ID,
                data: registration,
            });

            const success = result.data.data;
            const message = success === true ? '등록 완료' : '등록 실패';
            alert(message);
        } catch (err: any) {
            alert(`등록 실패 : ${err.toString()}`)
        }
    }

    return (
        <div>
            <h1>Register</h1>
            <button onClick={registerStart}>Register start</button>
            &nbsp;&nbsp;
            <button onClick={registerFinish}>Register finish</button>
            <div />
            <h1>Get data</h1>
            <button onClick={getDb}>Get Server data</button>
            &nbsp;&nbsp;
            <button onClick={() => console.log(registration)}>Get Client useState data</button>
        </div>
    );
}

