import axios from 'axios';

class Network {
    static get instance() {
        if (!Network._instance) {
            Network._instance = new Network();
        }
        return Network._instance;
    }

    async graphql(query, variables) {
        const jwt = this.jwt || '';
        const API_ADDRESS = process.browser ? '/api' : process.env.BASE_API_URL;
        const headers = jwt ? { Authorization: `bearer ${jwt}` } : {};
        const { data } = await axios.post(`${API_ADDRESS}/graphql`, { query, variables }, { headers });
        return data;
    }

    async get(url, _data) {
        const jwt = this.jwt || '';
        const API_ADDRESS = process.browser ? '/api' : process.env.BASE_API_URL;
        const headers = jwt ? { Authorization: `bearer ${jwt}` } : {};
        const { data } = await axios.get(`${API_ADDRESS}${url}`, { headers, ..._data });
        return data;
    }

    async delete(url, _data) {
        const jwt = this.jwt || '';
        const API_ADDRESS = process.browser ? '/api' : process.env.BASE_API_URL;
        const headers = jwt ? { Authorization: `bearer ${jwt}` } : {};
        const { data } = await axios.delete(`${API_ADDRESS}${url}`, { headers, ..._data });
        return data;
    }

    async put(url, _data) {
        const jwt = this.jwt || '';
        const API_ADDRESS = process.browser ? '/api' : process.env.BASE_API_URL;
        const headers = jwt ? { Authorization: `bearer ${jwt}` } : {};
        const { data } = await axios.put(`${API_ADDRESS}${url}`, _data, { headers });
        return data;
    }

    async post(url, _data) {
        const jwt = this.jwt || '';
        const API_ADDRESS = process.browser ? '/api' : process.env.BASE_API_URL;
        const headers = jwt ? { Authorization: `bearer ${jwt}` } : {};
        const { data } = await axios.post(`${API_ADDRESS}${url}`, _data, { headers });
        return data;
    }
}

export default Network.instance;