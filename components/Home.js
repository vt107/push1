import React from 'react';
import {AsyncStorage, View, Text, TouchableHighlight, Alert, FlatList, DeviceEventEmitter} from 'react-native';
import firebase from 'react-native-firebase';
import { Notification, NotificationOpen } from 'react-native-firebase';
import NotifyPayload from './NotifyPayload';
import RowNotify from './RowNotify';
import { RemoteMessage } from 'react-native-firebase';

import bsStyle from '../assets/BsStyle';
import { NotificationOpen } from 'react-native-firebase/notifications';

class HomeScreen extends React.Component {
  constructor(props) {
    super(props);
    firebase.messaging().subscribeToTopic('rain');
    this.state = {
      listNotify: false
    }
  }

  static navigationOptions = {
    title: 'Home',
  };

  componentDidMount() {
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
            if (nDetail.key && !tJson.find((notif) => {return notif.key == nDetail.key} )) {
              tJson.push(nDetail);
              AsyncStorage.setItem('list_notifications', JSON.stringify(tJson))
                .then(DeviceEventEmitter.emit('notifyChange'));
            }
          } else {
            AsyncStorage.setItem('list_notifications', JSON.stringify([nDetail]))
              .then(DeviceEventEmitter.emit('notifyChange'));
          }
        })
        .catch(error => {
          console.log('Error handling background message: ', error);
        });
    });

    this.notifOpen = firebase.notifications().getInitialNotification((notificationOpen: NotificationOpen))
    if (notificationOpen) {
      // User click open notification when app not opened yet
      console.log('User click open notification when app not opened yet');
      const action = notificationOpen.action;
      const notification: Notification = notificationOpen.notification;
      const notifyKey = notification.data.key;
      const { navigate } = this.props.navigation;
      navigate('Detail', {key: notifyKey});
      firebase.notifications().removeDeliveredNotification(notification.notificationId);
    }

    this.notificationDisplayedListener = firebase.notifications().onNotificationDisplayed((notification: Notification) => {

      console.log('Process notification in notificationDisplayedListener');
    });
    this.notificationListener = firebase.notifications().onNotification((notification: Notification) => {
      console.log('Process and display notification when app is opened');
      // Process notification as required
      notification
        .android.setChannelId('rain')
        .android.setSmallIcon('ic_launcher');
      firebase.notifications()
        .displayNotification(notification);
    });
    const channel = new firebase.notifications.Android.Channel('rain', 'Weather Rain', firebase.notifications.Android.Importance.Max)
      .setDescription('Get weather information info');
    // Create the channel
    firebase.notifications().android.createChannel(channel);

    // When user click open notification
    this.notificationOpenedListener = firebase.notifications().onNotificationOpened((notificationOpen: NotificationOpen) => {
      console.log('When user click open notification, app is opened');
      // Get the action triggered by the notification being opened
      const action = notificationOpen.action;
      // Get information about the notification that was opened
      const notification: Notification = notificationOpen.notification;
      const notifyKey = notification.data.key;
      const { navigate } = this.props.navigation;
      navigate('Detail', {key: notifyKey});
      firebase.notifications().removeDeliveredNotification(notification.notificationId);

    });
  }
  componentWillUnmount() {
    this.notifOpen();
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