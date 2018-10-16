import React from 'react';
import {AsyncStorage, View, Text, TouchableHighlight, Alert, FlatList, DeviceEventEmitter, Platform, ActivityIndicator} from 'react-native';
import firebase from 'react-native-firebase';
import { Notification, NotificationOpen } from 'react-native-firebase';
import NotifyPayload from './NotifyPayload';
import RowNotify from './RowNotify';
import { RemoteMessage } from 'react-native-firebase';

import bsStyle from '../assets/BsStyle';

export default class HomeScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listNotify: false
    }
  }

  static navigationOptions = {
    title: 'Home',
  };

  _handleNewNotify(tNotify) {
    console.log('handle new notify');
    return new Promise((resolve, reject) => {
      AsyncStorage.getItem('list_notifications').then((res) => {
        let listNotify = JSON.parse(res);
        let notify = new NotifyPayload(tNotify.data);
        if (listNotify && listNotify.length > 0) {
          if (!listNotify.find(notif => notif.key == notify.key)) {
            listNotify.push(notify);
          }
        } else {
          listNotify = [notify];
        }
        let tList = listNotify;
        if (listNotify.length > homeLimit) {
          tList = listNotify.slice(1).slice(0 - homeLimit);
        }
        this.setState({listNotify: tList.reverse()})
        AsyncStorage.setItem('list_notifications', JSON.stringify(listNotify))
        .then(resolve(true));
      }).catch((error) => {
        reject(error);
      })
    });
    }

  componentDidMount() {
    firebase.messaging().hasPermission()
    .then(enabled => {
      if (!enabled) {
        firebase.messaging().requestPermission();
      }
    })
    .catch(error => {
      console.log(error);
    });

    DeviceEventEmitter.addListener('notifyChange', () => {
      if (this._isMounted) {
        this.getNewestNotifications();
      }
    });
    this._isMounted = true;
    this.messageListener = firebase.messaging().onMessage((message: RemoteMessage) => {
      // Process your message as required
     this._handleNewNotify(message)
        .then(console.log('handle done'))
    });

    // Check if App was opened by a notification
    this.backgroundNotifyListener = firebase.notifications().getInitialNotification()
      .then((notificationOpen: NotificationOpen) => {
        if (notificationOpen) {
          console.log('App opened by notification');
          // const action = notificationOpen.action;
          const notification: Notification = notificationOpen.notification;
          firebase.notifications().removeDeliveredNotification(notification.notificationId);
          this._handleNewNotify(notification)
          .then(console.log('handle done'));
        }
      });
    if (Platform.OS === 'android') {
    const channel = new firebase.notifications.Android.Channel('rain', 'Weather Rain', firebase.notifications.Android.Importance.Max)
      .setDescription('Get weather information info');
    // Create the channel
    firebase.notifications().android.createChannel(channel);
  }
  
  this.notificationListener = firebase.notifications().onNotification((notification: Notification) => {
    console.log('Process and display notification when app is opened');
    console.log('Mount: ', this._isMounted);
    // Process notification as required
      notification
        .android.setChannelId('rain')
        .android.setSmallIcon('ic_launcher');
      firebase.notifications()
        .displayNotification(notification)
        .catch(error => {
          console.log(error);
        });
  });
  
  }
  componentWillUnmount() {
    this.backgroundNotifyListener();
    this.notificationListener();
    this.messageListener();
    DeviceEventEmitter.removeAllListeners();
    this._isMounted = false;
  }

  getNewestNotifications() {
    AsyncStorage.getItem('list_notifications')
      .then(res => {
        if (res) {
          let listNotify = JSON.parse(res);
          if (listNotify.length > homeLimit) {
            listNotify = listNotify.slice(1).slice(0 - homeLimit);
          }
          this.setState({listNotify: listNotify.reverse()})
        } else {
          this.setState({listNotify: []});
        }
      });
  }

  componentWillMount() {
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
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'center'}}>
              <TouchableHighlight underlayColor="#398439" style={[bsStyle.btn, homeStyle.btn, bsStyle.btnSuccess]} onPress={() => navigate('List')}>
                <View style={bsStyle.textCenter}>
                  <Text style={bsStyle.cWhite}>See All</Text>
                </View>
              </TouchableHighlight>
              <TouchableHighlight underlayColor="#c9302c" style={[bsStyle.btn, homeStyle.btn, homeStyle.btnSettings]} onPress={() => navigate('Settings')}>
                <View style={bsStyle.textCenter}>
                  <Text style={bsStyle.cWhite}>Settings</Text>
                </View>
              </TouchableHighlight>
            </View>
          </View>
        )
      } else {
        return (<View style={bsStyle.emptyStatusCover}>
        <Text style={{fontSize: 20}}>You have no notification!</Text>
          <TouchableHighlight underlayColor="#c9302c" style={[bsStyle.btn, homeStyle.btn, homeStyle.btnSettings]} onPress={() => navigate('Settings')}>
            <View style={bsStyle.textCenter}>
              <Text style={bsStyle.cWhite}>Settings</Text>
            </View>
          </TouchableHighlight>
        </View>)
      }
    } else {
      return (
      <View style={bsStyle.loading}>
        <ActivityIndicator size='large' color='#00ff00' />
      </View>
      )
    }
  }
}

let homeStyle = {
  btn: {
    marginTop: 10,
    width: 120,
    height: 40,
    justifyContent: 'center'
  },
  btnSettings: {
    marginLeft: 20,
    backgroundColor: '#dc3545',
  }
}

let homeLimit = 5;
