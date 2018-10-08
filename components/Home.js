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
    firebase.messaging().subscribeToTopic('rain');
    this.state = {
      listNotify: false
    }
  }

  static navigationOptions = {
    title: 'Home',
  };

  _handleNewNotify(notify) {
    return AsyncStorage.getItem('list_notifications')
    .then(res => {
      console.log('Saving to AsyncStorage');
      let data = notify.data;
      let nDetail = new NotifyPayload(data);
      if (res && res.length > 0) {
        let tJson = JSON.parse(res);
        if (nDetail.key && !tJson.find((notif) => {return notif.key == nDetail.key} )) {
          tJson.push(nDetail);
          return AsyncStorage.setItem('list_notifications', JSON.stringify(tJson));
        }
      } else {
        return AsyncStorage.setItem('list_notifications', JSON.stringify([nDetail]));
      }
    })
    .catch(error => {
      console.log('Error handling background message: ', error);
    });
  }

  componentDidMount() {
    // Check permission
    firebase.messaging().hasPermission()
      .then(enabled => {
        if (!enabled) {
          firebase.messaging().requestPermission()
          .then()
          .catch(error => {
            console.log(error);
          });
        }
      }).then(() => {
        firebase.messaging().subscribeToTopic('rain');
        console.log('Subcribed!');
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
        .then(DeviceEventEmitter.emit('notifyChange'));
    });

    // Check if App was opened by a notification
    firebase.notifications().getInitialNotification()
      .then((notificationOpen: NotificationOpen) => {
        if (notificationOpen) {
          // const action = notificationOpen.action;
          const notification: Notification = notificationOpen.notification;
          this._handleNewNotify(notification)
            .then(()=> {
              this.getNewestNotifications();
              firebase.notifications().removeDeliveredNotification(notification.notificationId);
            });
        }
      });
    
    const channel = new firebase.notifications.Android.Channel('rain', 'Weather Rain', firebase.notifications.Android.Importance.Max)
      .setDescription('Get weather information info');
    // Create the channel
    firebase.notifications().android.createChannel(channel);
  }
  componentWillUnmount() {
    DeviceEventEmitter.removeListener('notifyChange');
    this.notificationListener();
    this.messageListener();
    DeviceEventEmitter.removeAllListeners();
    this._isMounted = false;
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