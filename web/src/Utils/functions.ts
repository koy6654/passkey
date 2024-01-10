import axios from 'axios';
import {BASE_URL} from './env';

export async function getDb () {
    try {
        const result = await axios.get(`${BASE_URL}/db`);
        const data = result.data.data;
        console.log(data);
    } catch (err: any) {
        alert(err.toString())
    }
}
