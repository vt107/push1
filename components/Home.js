import React from 'react';
import {AsyncStorage, View, Text, TouchableHighlight, Alert, FlatList, DeviceEventEmitter} from 'react-native';
import firebase from 'react-native-firebase';
import { Notification, NotificationOpen } from 'react-native-firebase';
import NotifyPayload from './NotifyPayload';
import RowNotify from './RowNotify';
import { RemoteMessage } from 'react-native-firebase';

import bsStyle from '../assets/BsStyle';

class HomeScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listNotify: false
    }
  }

  static navigationOptions = {
    title: 'Home',
  };

 async componentDidMount() {
    console.log('Component did mount');
    // Check permission
    firebase.messaging().hasPermission()
      .then(enabled => {
        if (enabled) {
          firebase.messaging().subscribeToTopic('rain');
        } else {
          firebase.messaging().requestPermission()
            .then(() => {
              firebase.messaging().subscribeToTopic('rain');
            })
            .catch(error => {
              console.log(error);
            });
        }
      });

    DeviceEventEmitter.addListener('notifyChange', () => {
      if (this._isMounted) {
        this.getNewestNotifications();
      }
    });
    this._isMounted = true;
    this.messageListener = firebase.messaging().onMessage((message: RemoteMessage) => {
      // Process your message as required
      AsyncStorage.getItem('list_notifications')
        .then(res => {
          console.log('Saving to AsyncStorage');
          let data = message.data;
          let nDetail = new NotifyPayload(data);
          if (res && res.length > 0) {
            let tJson = JSON.parse(res);
            tJson.push(nDetail);
            AsyncStorage.setItem('list_notifications', JSON.stringify(tJson))
              .then(DeviceEventEmitter.emit('notifyChange'));
          } else {
            AsyncStorage.setItem('list_notifications', JSON.stringify([nDetail]))
              .then(DeviceEventEmitter.emit('notifyChange'));
          }
          const notification = new firebase.notifications.Notification()
            .setNotificationId('notificationId')
            .setTitle(nDetail.title)
            .setBody(nDetail.message)
            .setData(nDetail)
            .android.setChannelId('rain')
            .android.setSmallIcon('ic_launcher');

          firebase.notifications()
            .displayNotification(notification)
            .then(firebase.notifications().removeDeliveredNotification(notification.notificationId));
        })
        .catch(error => {
          console.log('Error handling background message: ', error);
        });
    });
  }
  componentWillUnmount() {
    DeviceEventEmitter.removeListener('notifyChange');
    this.notificationDisplayedListener();
    this.notificationListener();
    this.notificationOpenedListener();
    this.messageListener();
    DeviceEventEmitter.removeAllListeners();
    DeviceEventEmitter.removeAllDeliveredNotifications();
    this._isMounted = false;
  }

  getNewestNotifications(limit = 5) {
    console.log('Begin get newest');
    AsyncStorage.getItem('list_notifications')
      .then(res => {
        console.log("is mounted?", this._isMounted);
        if (res) {
          let listNotify = JSON.parse(res);
          if (listNotify.length > limit) {
            listNotify = listNotify.slice(1).slice(0 - limit);
          }
          this.setState({listNotify: listNotify})
        } else {
          this.setState({listNotify: []});
        }
      });
  }

  _confirmResetNotify() {
    Alert.alert(
      'Confirm delete',
      'Area you sure want to delete all notifications?',
      [
        {text: 'Cancel', onPress: () => {}, style: 'cancel'},
        {text: 'OK', onPress: () => {this._resetNotify()}},
      ],
      { cancelable: false }
    )
  }

  _resetNotify() {
    AsyncStorage.setItem('list_notifications', '').then(() => {
      alert('Reset notifications successfully');
      DeviceEventEmitter.emit('notifyChange');
    })
  }

  componentWillMount() {
    console.log('Component will mount');
    this.getNewestNotifications();
  }

  render() {
    const { navigate } = this.props.navigation;
    if (this.state.listNotify !== false) {
      if (this.state.listNotify.length > 0) {
        return (
          <View>
            <FlatList
              data={this.state.listNotify}
              renderItem={({item}) => <RowNotify notify={item} navigate={navigate}/>
              }
              keyExtractor={(item) => item.key}
            />
            <View style={{alignItems: 'center', marginTop: 10}}>
              <TouchableHighlight underlayColor="white" onPress={() => navigate('List')}>
                <View style={[bsStyle.btn, bsStyle.btnSuccess]}>
                  <Text style={bsStyle.btnText}>See All</Text>
                </View>
              </TouchableHighlight>
            </View>
            <View style={{alignItems: 'center', marginTop: 10}}>
              <TouchableHighlight underlayColor="white" onPress={() => this._confirmResetNotify()}>
                <View style={[bsStyle.btn, bsStyle.btnInfo]}>
                  <Text style={bsStyle.btnText}>Reset</Text>
                </View>
              </TouchableHighlight>
            </View>
          </View>
        )
      } else {
        return (<View style={bsStyle.emptyStatusCover}><Text>You have no notification!</Text></View>)
      }
    } else {
      return (<View style={bsStyle.emptyStatusCover}><Text>Loading...</Text></View>)
    }
  }
}

export default HomeScreen;