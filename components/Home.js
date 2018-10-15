import React from 'react';
import {AsyncStorage, View, Text, TouchableHighlight, Alert, FlatList, DeviceEventEmitter, Platform} from 'react-native';
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

  async _handleNewNotify(tNotify) {
    let listString = await AsyncStorage.getItem('list_notifications');
    console.log('begin handle');
    let listNotify = JSON.parse(listString);
    let notify = new NotifyPayload(tNotify.data);
    if (listNotify && listNotify.length > 0) {
      if (!listNotify.find(notif => notif.key === notify.key)) {
        listNotify.push(notify);
      }
    } else {
      listNotify = [notify];
    }
    await AsyncStorage.setItem('list_notifications', JSON.stringify(listNotify));
    DeviceEventEmitter.emit('notifyChange', {type: 'add', data: {
      key: notify.key
    }});
    this.getNewestNotifications();
    console.log('Done in handle');
  }

  componentDidMount() {
    console.log('didmounttt');
    /*
    DeviceEventEmitter.addListener('notifyChange', () => {
      if (this._isMounted) {
        this.getNewestNotifications();
      }
    });
    this._isMounted = true;
    this.messageListener = firebase.messaging().onMessage((message: RemoteMessage) => {
      // Process your message as required
     this._handleNewNotify(message)
        .then(console.log('Done handle message'));
    });

    // Check if App was opened by a notification
    this.backgroundNotifyListener = firebase.notifications().getInitialNotification()
      .then((notificationOpen: NotificationOpen) => {
        if (notificationOpen) {
          console.log('App opened by notification');
          // const action = notificationOpen.action;
          const notification: Notification = notificationOpen.notification;
          firebase.notifications().removeDeliveredNotification(notification.notificationId);
          this._handleNewNotify(notification);
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
    // Process notification as required
    notification
      .android.setChannelId('rain')
      .android.setSmallIcon('ic_launcher');
    firebase.notifications()
      .displayNotification(notification);
  });

    */
  }
  componentWillUnmount() {
    /*
    DeviceEventEmitter.removeListener('notifyChange');
    this.backgroundNotifyListener();
    this.notificationListener();
    this.messageListener();
    DeviceEventEmitter.removeAllListeners();
    this._isMounted = false;
    */
  }

  getNewestNotifications(limit = 5) {
    AsyncStorage.getItem('list_notifications')
      .then(res => {
        if (res) {
          let listNotify = JSON.parse(res);
          if (listNotify.length > limit) {
            listNotify = listNotify.slice(1).slice(0 - limit);
          }
          this.setState({listNotify: listNotify.reverse()})
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
      DeviceEventEmitter.emit('notifyChange');
    })
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
              <TouchableHighlight underlayColor="white" style={[bsStyle.btn, homeStyle.btn, bsStyle.btnDanger]} onPress={() => navigate('Test')}>
                <View style={bsStyle.textCenter}>
                  <Text style={bsStyle.cWhite}>Test</Text>
                </View>
              </TouchableHighlight>
              <TouchableHighlight underlayColor="white" style={[bsStyle.btn, homeStyle.btn, bsStyle.btnSuccess]} onPress={() => navigate('List')}>
                <View style={bsStyle.textCenter}>
                  <Text style={bsStyle.cWhite}>See All</Text>
                </View>
              </TouchableHighlight>
              <TouchableHighlight underlayColor="white" style={[bsStyle.btn, homeStyle.btn, homeStyle.btnReset]} onPress={() => this._confirmResetNotify()}>
                <View style={bsStyle.textCenter}>
                  <Text style={bsStyle.cWhite}>Reset</Text>
                </View>
              </TouchableHighlight>
            </View>
          </View>
        )
      } else {
        return (<View style={bsStyle.emptyStatusCover}>
          <Text>You have no notification!</Text>
          <TouchableHighlight underlayColor="white" style={[bsStyle.btn, homeStyle.btn, bsStyle.btnDanger]} onPress={() => navigate('Test')}>
            <View style={bsStyle.textCenter}>
              <Text style={bsStyle.cWhite}>Test</Text>
            </View>
          </TouchableHighlight>
        </View>)
      }
    } else {
      return (<View style={bsStyle.emptyStatusCover}><Text>Loading...</Text></View>)
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
  btnReset: {
    marginLeft: 20,
    backgroundColor: '#dc3545',
  }
};
