import React from 'react';
import { StyleSheet, Platform, Image, Text, View, ScrollView } from 'react-native';

import firebase from 'react-native-firebase';

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      // firebase things?
    };
  }

  componentDidMount() {
    console.log('Component didmount!');
    firebase.messaging().hasPermission()
      .then(enabled => {
        if (enabled) {
        } else {
          firebase.messaging().requestPermission()
            .then(() => {
              alert("You will receive new notifications!")
            })
            .catch(error => {
              console.log(error);
              alert('You must allow showing notification!');
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

    const notificationOpen: NotificationOpen = await firebase.notifications().getInitialNotification();
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

  render() {
    return (
      <ScrollView>
        <View style={styles.container}>
          <Image source={require('./assets/RNFirebase.png')} style={[styles.logo]}/>
          <Text style={styles.welcome}>
            Welcome to {'\n'} React Native Firebase
          </Text>
          <Text style={styles.instructions}>
            To get started, edit App.js
          </Text>
          {Platform.OS === 'ios' ? (
            <Text style={styles.instructions}>
              Press Cmd+R to reload,{'\n'}
              Cmd+D or shake for dev menu
            </Text>
          ) : (
            <Text style={styles.instructions}>
              Double tap R on your keyboard to reload,{'\n'}
              Cmd+M or shake for dev menu
            </Text>
          )}
          <View style={styles.modules}>
            <Text style={styles.modulesHeader}>The following Firebase modules are pre-installed:</Text>
            {firebase.admob.nativeModuleExists && <Text style={styles.module}>admob()</Text>}
            {firebase.analytics.nativeModuleExists && <Text style={styles.module}>analytics()</Text>}
            {firebase.auth.nativeModuleExists && <Text style={styles.module}>auth()</Text>}
            {firebase.config.nativeModuleExists && <Text style={styles.module}>config()</Text>}
            {firebase.crashlytics.nativeModuleExists && <Text style={styles.module}>crashlytics()</Text>}
            {firebase.database.nativeModuleExists && <Text style={styles.module}>database()</Text>}
            {firebase.firestore.nativeModuleExists && <Text style={styles.module}>firestore()</Text>}
            {firebase.functions.nativeModuleExists && <Text style={styles.module}>functions()</Text>}
            {firebase.iid.nativeModuleExists && <Text style={styles.module}>iid()</Text>}
            {firebase.invites.nativeModuleExists && <Text style={styles.module}>invites()</Text>}
            {firebase.links.nativeModuleExists && <Text style={styles.module}>links()</Text>}
            {firebase.messaging.nativeModuleExists && <Text style={styles.module}>messaging()</Text>}
            {firebase.notifications.nativeModuleExists && <Text style={styles.module}>notifications()</Text>}
            {firebase.perf.nativeModuleExists && <Text style={styles.module}>perf()</Text>}
            {firebase.storage.nativeModuleExists && <Text style={styles.module}>storage()</Text>}
          </View>
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  logo: {
    height: 120,
    marginBottom: 16,
    marginTop: 32,
    width: 120,
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  modules: {
    margin: 20,
  },
  modulesHeader: {
    fontSize: 16,
    marginBottom: 8,
  },
  module: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  }
});
