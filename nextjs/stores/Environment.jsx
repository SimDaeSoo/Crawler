import { observable } from 'mobx';

class Environment {
    @observable query = {};
    @observable size = 'default';

    hydrate = (initializeData) => {
        if (!initializeData) return;
        this.query = initializeData.query || {};
    }
}

export default Environment;