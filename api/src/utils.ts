function uintToString(int: number[]) {
    const base64string = btoa(String.fromCharCode(...int));
    return base64string.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64ToUint8Array(str: string) {
    str = str.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
    return new Uint8Array(Array.prototype.map.call(atob(str), (c) => c.charCodeAt(0)));
}

function getSavedAuthenticatorData(user) {
    return {
        credentialID: base64ToUint8Array(user.credentialID),
        credentialPublicKey: base64ToUint8Array(user.credentialPublicKey),
        counter: user.counter,
    }
}

function getRegistrationInfo(registrationInfo) {
    const {credentialPublicKey, counter, credentialID} = registrationInfo;
    return {
        credentialID: uintToString(credentialID),
        credentialPublicKey: uintToString(credentialPublicKey),
        counter,
    }
}

function getNewChallenge() {
    return Math.random().toString(36).substring(2);
}

function convertChallenge(challenge) {
    return btoa(challenge).replace(/=/g, '');
}

const findUser = (users, userId: string) => {
    const user = users[userId];
    if (user == null) {
        throw new Error('not_exist_user');
    }

    return user;
}

export {
    getSavedAuthenticatorData,
    getRegistrationInfo,
    getNewChallenge,
    convertChallenge,
    findUser,
}
