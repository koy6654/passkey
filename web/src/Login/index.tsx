import {useState} from 'react';
import type {PublicKeyCredentialCreationOptionsJSON, AuthenticationResponseJSON} from '@simplewebauthn/typescript-types';
import axios from 'axios';
import {getDb} from '../Utils/functions';
import {USER_ID, BASE_URL} from '../Utils/env'
import { startAuthentication } from '@simplewebauthn/browser';

export default function Login () {
    const [authentication, setAuthentication] = useState<AuthenticationResponseJSON>();

    async function loginStart () {
        try {
            const result = await axios.post<{data: PublicKeyCredentialCreationOptionsJSON}>(`${BASE_URL}/login/start`, {
                id: USER_ID,
            });

            const authenticationOptions = result.data.data;
            const registration = await startAuthentication(authenticationOptions);

            setAuthentication(registration);
            alert('로그인 시작');
        } catch (err: any) {
            alert(`로그인 실패 : ${err.toString()}`)
        }

    }

    async function loginFinish () {
        try {
            const result = await axios.post<{data: boolean}>(`${BASE_URL}/login/finish`, {
                id: USER_ID,
                data: authentication,
            });

            const success = result.data.data;
            const message = success === true ? '로그인 완료' : '로그인 실패';
            alert(message);
        } catch (err: any) {
            alert(`로그인 실패 : ${err.toString()}`)
        }
    }

    return (
        <div>
            <h1>Login</h1>
            <button onClick={loginStart}>Login start</button>
            &nbsp;&nbsp;
            <button onClick={loginFinish}>Login finish</button>
            <div />
            <h1>Get data</h1>
            <button onClick={getDb}>Get Server data</button>
            &nbsp;&nbsp;
            <button onClick={() => console.log(authentication)}>Get Client useState data</button>
        </div>
    );
}

