import { useState, useEffect } from 'react';
import { withRouter } from 'next/router'
import { observer, inject } from 'mobx-react';
import { Tag, Rate, Button, message, Progress } from 'antd';
import { MailOutlined, FormOutlined } from '@ant-design/icons';
import InfiniteScroll from 'react-infinite-scroll-component';
import Network from '../utils/network';
import { getInitializeAuthData } from '../stores/Auth';

const Review = inject('auth')(observer(({ auth, router, dramas, reviews }) => {
  const [_reviews, setReviews] = useState(reviews);
  const [_dramas, setDramas] = useState(dramas);
  useEffect(() => {
    if (reviews.length < 30) {
      message.info('비교할 평점 데이터가 부족합니다.', 5);
      message.info('자신이 보았던 드라마에 점수를 주세요!', 5);
    } else {
      message.success('추천 데이터가 충분하여 홈으로 이동합니다.');
      router.push('/', '/');
    }
  }, []);

  const fetchData = async () => {
    const newDramas = await Network.get(`/dramas?_limit=30&_start=${_dramas.length}&_sort=period:DESC`);
    setDramas([..._dramas, ...newDramas]);
  }

  const linkTo = (url) => router.push(url, url);
  const logout = () => auth.logout();
  const getRate = (id) => (_reviews.filter(review => review.drama.id === id)[0] || {}).rate || 0;

  const changeRate = async (id, rate) => {
    const __reviews = await Network.get(`/reviews?user=${auth.user.id}&drama=${id}&_limit=3000`);
    if (__reviews.length) {
      const review = __reviews[0];
      await Network.put(`/reviews/${review.id}`, { rate });
    } else {
      await Network.post(`/reviews`, { user: auth.user.id, drama: id, rate });
    }

    const allReviews = await Network.get(`/reviews?user=${auth.user.id}&_limit=3000`);
    if (allReviews.length >= 30) {
      message.success('추천 데이터가 충분하여 홈으로 이동합니다.');
      router.push('/', '/');
    }
    setReviews(allReviews);
  }

  return (
    <div id='scrollableDiv' className="container" style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
      <div style={{ position: 'fixed', zIndex: 4, top: 0, width: '100%', height: '40px', textAlign: 'right', background: 'rgba(0,0,0,0.5)' }}>
        {
          auth.hasPermission &&
          <div>
            <Tag color='blue' style={{ margin: '4px', height: '32px', fontSize: '14px', lineHeight: '30px' }}>{auth.user.username} ({auth.user.age}세 / {auth.user.gender === 'MALE' ? '남자' : '여자'})</Tag>
            <Tag color='magenta' style={{ margin: '4px', height: '32px', fontSize: '14px', lineHeight: '30px' }}>리뷰 {_reviews.length}개</Tag>
            <Button type='danger' style={{ margin: '4px' }} onClick={() => logout()}>로그아웃</Button>
          </div>
        }
        {!auth.hasPermission && <Button style={{ margin: '4px' }} icon={<MailOutlined />} onClick={() => linkTo('/login')}>로그인</Button>}
        {!auth.hasPermission && <Button style={{ margin: '4px', marginRight: '8px' }} icon={<FormOutlined />} onClick={() => linkTo('/register')}>회원가입</Button>}
      </div>

      {
        _reviews.length < 30 &&
        <div style={{ position: 'fixed', zIndex: 4, bottom: 0, width: '100%', height: '32px', textAlign: 'center', background: 'rgba(0,0,0,0.5)', padding: '4px', paddingRight: '16px' }}>
          <Progress percent={Math.round(_reviews.length / 30 * 100)} status="active" />
        </div>
      }

      <InfiniteScroll
        dataLength={_dramas.length}
        next={fetchData}
        hasMore={true}
        loader={<h4>불러오는 중...</h4>}
        scrollableTarget="scrollableDiv"
        style={{ textAlign: 'center', marginTop: '40px' }}
      >
        {
          _dramas.map((drama, index) => {
            const base = drama.thumbnail.split('._')[0].split('https://m.media-amazon.com/images/M/')[1];
            const extension = drama.thumbnail.split('._')[1].split('.')[1];
            const thumbnail = `/assets/${base}.${extension}`;

            return (
              <div key={index} style={{ width: '320px', height: '440px', border: '1px solid #303030', margin: '15px', display: 'inline-block', textAlign: 'left', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '318px', height: '438px' }}>
                  <img src={thumbnail} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)', zIndex: 1 }} />
                  <div style={{ position: 'absolute', top: '2px', left: '2px', zIndex: 2, }}>
                    <Tag># {drama.id}</Tag>
                    {drama.age && <Tag>{drama.age}세 이용가</Tag>}
                    {drama.time && <Tag>{drama.time}</Tag>}
                  </div>
                </div>
                <div style={{ position: 'absolute', top: 0, width: '100%', textAlign: 'center', fontSize: '24px', padding: '8px', paddingTop: '28px', paddingBottom: '36px', backgroundColor: 'rgba(0,0,0,0.2)', textShadow: '2px 2px 2px black' }}>
                  {drama.title}<br />{drama.period}
                  <div style={{ position: 'absolute', bottom: '8px', left: 0, width: '100%' }}>
                    {
                      drama.genres.map((genre, index) => {
                        return (
                          <Tag key={index}>{genre.match}</Tag>
                        )
                      })
                    }
                  </div>
                </div>
                <div style={{ position: 'absolute', bottom: '64px', width: '100%', padding: '10px', backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 3, borderTop: '1px solid #303030' }}>{drama.description}</div>
                <div style={{ position: 'absolute', bottom: 0, width: '100%', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingTop: '12px', paddingBottom: '12px' }}>
                  <Rate allowHalf style={{ fontSize: '36px', lineHeight: '36px' }} value={getRate(drama.id)} onChange={(e) => changeRate(drama.id, e)} />
                </div>
              </div>
            )
          })
        }
      </InfiniteScroll>
    </div >
  )
}));

export async function getServerSideProps(context) {
  const auth = await getInitializeAuthData(context, { routing: true });
  const dramas = await Network.get('/dramas?_limit=30&_start=0&_sort=period:DESC');
  if (auth.user && auth.user.id) {
    const reviews = await Network.get(`/reviews?user=${auth.user.id}&_limit=3000`);
    return { props: { initializeData: { auth, environment: { query: context.query } }, dramas, reviews } };
  } else {
    return { props: { initializeData: { auth, environment: { query: context.query } }, dramas, reviews: [] } };
  }
}

export default withRouter(Review);