import React from 'react';

/* MobX */
import { Provider } from 'mobx-react';
import { useStore } from '../stores';

/* Styles */
import '../public/styles/init.css';

/* Components */
import Head from '../components/Head';

const App = ({ Component, pageProps }) => {
    const store = useStore(pageProps.initializeData);

    return (
        <Provider {...store}>
            <Head title={'Drama Recommend'}/>
            <Component {...pageProps} />
        </Provider>
    )
}

export default App;