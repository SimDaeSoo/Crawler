import { useState } from 'react';
import { withRouter } from 'next/router'
import { observer, inject } from 'mobx-react';
import { Button, Form, Input, Radio, InputNumber, Select, message } from 'antd';
import { getInitializeAuthData } from '../stores/Auth';
import Network from '../utils/network';

const Register = inject('auth')(observer(({ router, jobs, auth }) => {
  const onFinish = async (values) => {
    try {
      await Network.post('/auth/local/register', values);
      message.success(`회원가입에 성공했습니다.`, 3);
      router.push('/login', '/login');
    } catch (e) {
      message.warning(`회원가입에 실패했습니다. 이미 가입한 회원인지 확인해 주세요.`, 3);
    }
  };

  const onFinishFailed = errorInfo => {
    message.warning(`${errorInfo.errorFields[0].errors[0]}`, 3);
  };

  return (
    <div id='scrollableDiv' className="container" style={{ width: '100%', height: '100%', overflowY: 'auto', display: 'flex' }}>
      <div style={{ width: '400px', maxWidth: '95%', margin: 'auto' }}>
        <h1 style={{ textAlign: 'center' }}>드라마 추천 시스템 회원가입</h1>
        <Form
          layout='vertical'
          initialValues={{ age: 20 }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
        >
          <Form.Item
            label="사용자 이름"
            name="username"
            rules={[{ required: true, message: '사용자 이름을 설정해 주세요.' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="이메일"
            name="email"
            rules={[{ required: true, message: '이메일을 설정해 주세요.' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="패스워드"
            name="password"
            rules={[{ required: true, message: '패스워드를 설정해 주세요.' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="age"
            label="나이"
            rules={[{ required: true, message: '나이를 작성해 주세요.' }]}
          >
            <InputNumber min={1} max={200} style={{ width: '100%' }} formatter={value => `${value}세`} parser={value => value.replace('세', '')} />
          </Form.Item>

          <Form.Item name="job_category" label="직종" rules={[{ required: true, message: '본인의 직종을 선택해 주세요.' }]}>
            <Select placeholder="직종을 선택해 주세요">
              {(jobs || []).map((job, index) => <Select.Option value={job.id} key={index}>{job.name}</Select.Option>)}
            </Select>
          </Form.Item>

          <Form.Item
            name="gender"
            label="성별"
            rules={[{ required: true, message: '성별을 선택해 주세요.' }]}
          >
            <Radio.Group style={{ width: '100%' }}>
              <Radio.Button value="MALE" style={{ width: '50%' }}>남자</Radio.Button>
              <Radio.Button value="FEMALE" style={{ width: '50%' }}>여자</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              회원가입
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div >
  )
}));

export async function getServerSideProps(context) {
  const auth = await getInitializeAuthData(context, { routing: false });
  const jobs = await Network.get(`/job-categories`);
  return { props: { initializeData: { auth, environment: { query: context.query } }, jobs } };
}

export default withRouter(Register);