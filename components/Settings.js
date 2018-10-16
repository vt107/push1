import React from 'react';
import { Switch, View, Text, FlatList, AsyncStorage, ActivityIndicator, NetInfo, TouchableHighlight } from 'react-native';
import firebase from 'react-native-firebase';

import bsStyle from '../assets/BsStyle';

export default class SettingsScreen extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      listTopic: false,
      topicSubscribed: [],
      refresh: false,
      isOnline: true
    }
  }

  getRemoteTopics() {
    return new Promise((resolve, reject) => {
      if (this.state.isOnline) {
        fetch('https://us-central1-testpush-2549f.cloudfunctions.net/getTopics')
          .then((response) => response.json())
          .then((responseJson) => {
            console.log('Got result: ', responseJson);
            let topics = [];
            for (let key in responseJson) {
              if (typeof responseJson[key] !== 'function') {
                topics.push({key: key, text: responseJson[key]})
              }
            }
            console.log('List topic from Network: ', topics);
            resolve(topics);
        })
          .catch((error) => {
            reject(error);
        });
      } else {
        alert('Cannot retrieve list Topic becase you\'re now offline!');
        resolve([]);
      }
    });
  }

  getLocalTopics() {
    return new Promise((resolve, reject) => {
      AsyncStorage.getItem('list_topics')
        .then(res => {
          let localTopics = res? JSON.parse(res): [];
          resolve(localTopics);
        })
        .catch(error => {
          reject(error);
        })
    })
  }

  handleNetworkChange(connectionInfo) {
    console.log('Network change detected, now is: ', connectionInfo.type);
    this.setState({isOnline: connectionInfo.type !== 'none'})
  }

  componentWillMount() {
    NetInfo.getConnectionInfo().then((connectionInfo) => {
      this.setState({isOnline: connectionInfo.type !== 'none'})
    });
    
    NetInfo.addEventListener(
      'connectionChange',
      this.handleNetworkChange
    );


    AsyncStorage.getItem('subscribed_topics')
      .then(res => {
        let listSubscribed = res? JSON.parse(res): [];
        this.setState({topicSubscribed: listSubscribed});
        this.getLocalTopics().then(localTopics => {
          if (localTopics.length > 0) {
            this.setState({listTopic: this.filterTopic(localTopics, listSubscribed)});
          } else {
            this.getRemoteTopics()
              .then(remoteTopics => {
                this.setState({listTopic: this.filterTopic(remoteTopics, listSubscribed)});
                AsyncStorage.setItem('list_topics', JSON.stringify(remoteTopics));
              })
          }
        })
      });

    firebase.messaging().hasPermission()
      .then(enabled => {
        if (!enabled) {
          firebase.messaging().requestPermission()
            .then()
            .catch(this.props.navigation.navigate('Home'));
        }
      })
      .catch(error => {
        console.log(error);
      });

  }

  componentDidMount() {
    NetInfo.removeEventListener(
      'connectionChange',
      this.handleNetworkChange
    );
  }

  filterTopic(currentList, listSubscribed) {
    currentList.forEach(topic => {
      topic.subscribed = listSubscribed.indexOf(topic.key) !== -1;
    });
    return currentList;
  }

  _handleChange(key, value) {
    if (key && this.state.isOnline) {
      let listTopic = this.state.listTopic;
      let foundIndex = listTopic.findIndex(x => x.key === key);
      if (foundIndex !== -1) listTopic[foundIndex].subscribed = value;
      this.setState({listTopic: listTopic});
      this.setState({refresh: !this.state.refresh});

      let listSubsribed = [];
      listTopic.forEach(topic => {
        if (topic.subscribed) listSubsribed.push(topic.key);
      });
      AsyncStorage.setItem('subscribed_topics', JSON.stringify(listSubsribed));
      this.setState({topicSubscribed: listSubsribed});

      if (value) {
        firebase.messaging().subscribeToTopic(key);
        console.log('Subscribed to topic: ', key);
      } else {
        firebase.messaging().unsubscribeFromTopic(key);
        console.log('UnSubscribed from topic: ', key);
      }
    } else {
      alert('Request rejected, you\'re now offline!');
    }
  }

  updateTopicFromRemote() {
    this.getRemoteTopics()
      .then(remoteTopics => {
        this.setState({listTopic: this.filterTopic(remoteTopics, this.state.topicSubscribed)});
        AsyncStorage.setItem('list_topics', JSON.stringify(remoteTopics));
      })
  }

  render() {
    if (this.state.listTopic === false) {
      return (<View style={bsStyle.loading}>
      <ActivityIndicator size='large' color='#00ff00' />
    </View>)
    } else {
      return (
        <View>
          <FlatList
            data={this.state.listTopic}
            renderItem={({item}) =>
              <View style={style.cover}>
                <Text style={style.text}>{item.text}</Text>
                <Switch value={item.subscribed} onValueChange={val => this._handleChange(item.key, val)} style={style.control} />
              </View>
            }
            extraData={this.state}
          />
          <View style={{alignItems: 'center', marginTop: 10}}>
            <TouchableHighlight underlayColor="#398439" onPress={() => this.updateTopicFromRemote()}>
              <View style={[bsStyle.btn, bsStyle.btnSuccess]}>
                <Text style={bsStyle.btnText}>Update Topics</Text>
              </View>
            </TouchableHighlight>
          </View>
        </View>
      )
    }
  }
}

let style = {
  cover: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'

  },
  text: {
    width: '75%'
  },
  control: {
    width: '20%'
  }
};