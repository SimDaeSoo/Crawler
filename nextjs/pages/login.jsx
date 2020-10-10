import { useState } from 'react';
import { withRouter } from 'next/router'
import { observer, inject } from 'mobx-react';
import { getInitializeAuthData } from '../stores/Auth';
import { _setCookieCSR } from '../utils';
import { Input, Button, message } from 'antd';
import axios from 'axios';

const Login = inject('auth')(observer(({ router, auth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const changeEmail = (e) => setEmail(e.target.value);
  const changePassword = (e) => setPassword(e.target.value);
  const register = () => router.push('/register');

  const login = async () => {
    try {
      const { data } = await axios.post(`/api/auth/local`, { identifier: email, password: password });

      if (data.jwt) {
        auth.jwt = data.jwt;
        auth.user = data.user;
        _setCookieCSR('jwt', data.jwt);
        router.push(`/`);
      } else {
        message.error('잘못된 정보입니다. 이메일, 패스워드를 확인해 주세요.');
      }
    } catch (e) {
      message.error('잘못된 정보입니다. 이메일, 패스워드를 확인해 주세요.');
    }
  }


  return (
    <div className="container" style={{ width: '100%', height: '100%', overflowY: 'auto', display: 'flex' }}>
      <div style={{ width: '300px', maxHeight: '90%', margin: 'auto', textAlign: 'center' }}>
        <h1>영화 추천 시스템</h1>
        <Input value={email} onChange={e => changeEmail(e)} placeholder="이메일" />
        <Input.Password value={password} onChange={e => changePassword(e)} placeholder="비밀번호" />
        <Button type='primary' onClick={() => login()} style={{ width: '130px', margin: '10px' }}>로그인</Button>
        <Button type='danger' onClick={() => register()} style={{ width: '130px', margin: '10px' }}>회원가입</Button>
      </div>
    </div >
  )
}));

export async function getServerSideProps(context) {
  const auth = await getInitializeAuthData(context, { routing: false });
  return { props: { initializeData: { auth, environment: { query: context.query } } } };
}

export default withRouter(Login);