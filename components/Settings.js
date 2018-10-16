import React from 'react';
import { Switch, View, Text, FlatList, AsyncStorage, ActivityIndicator, NetInfo, TouchableHighlight, Alert, Modal } from 'react-native';
import firebase from 'react-native-firebase';

import bsStyle from '../assets/BsStyle';

export default class SettingsScreen extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      listTopic: false,
      topicSubscribed: [],
      refresh: false,
      isOnline: true,
      isLoading: false
    }
  }

  getRemoteTopics() {
    return new Promise((resolve, reject) => {
      if (this.state.isOnline) {
        fetch('https://us-central1-testpush-2549f.cloudfunctions.net/getTopics')
          .then((response) => response.json())
          .then((responseJson) => {
            let topics = [];
            for (let key in responseJson) {
              if (typeof responseJson[key] !== 'function') {
                topics.push({key: key, text: responseJson[key]})
              }
            }
            resolve(topics);
        })
          .catch((error) => {
            reject(error);
        });
      } else {
        reject('Cannot retrieve list Topic becase you\'re now offline!')
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

  componentWillMount() {
    NetInfo.getConnectionInfo().then((connectionInfo) => {
      this.setState({isOnline: connectionInfo.type !== 'none'})
    });

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
              .catch(error => {
                this.setState({listTopic: []});
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
    this._isMounted = true;
    NetInfo.addEventListener(
      'connectionChange', (connectionInfo => {
        console.log('Change');
        if (this._isMounted) {
          this.setState({isOnline: connectionInfo.type !== 'none'})
        }
      })
    );
  }

  componentWillUnmount() {
    this._isMounted = false;
    NetInfo.removeEventListener('connectionChange');
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
      } else {
        firebase.messaging().unsubscribeFromTopic(key);
      }
    } else {
      Alert.alert('Error', 'Request rejected because you\'re now offline!');
    }
  }

  updateTopicFromRemote() {
    this.setState({isLoading: true});
    this.getRemoteTopics()
      .then(remoteTopics => {
          this.setState({listTopic: this.filterTopic(remoteTopics, this.state.topicSubscribed)});
          this.setState({isLoading: false});
          AsyncStorage.setItem('list_topics', JSON.stringify(remoteTopics));
      })
      .catch(error => {
        Alert.alert('Error', error);
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
          <View>
              <Modal
              animationType="slide"
              transparent={true}
              visible={this.state.isLoading}
              onRequestClose={() => {}}>
              <View style={{backgroundColor: '#00000040', flex: 1, alignItems: 'center', flexDirection: 'column', justifyContent: 'space-around'}}>
                <View style={{ height: 100, width: 100, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#FFFFFF'}}>
                <ActivityIndicator size='large' color='#00ff00' />
                </View>
              </View>
            </Modal>

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