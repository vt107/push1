import firebase from 'react-native-firebase';
import type { RemoteMessage } from 'react-native-firebase';
import {AsyncStorage} from "react-native";
import AndroidNotification from "react-native-firebase/dist/modules/notifications/AndroidNotification";
import IOSNotification from "react-native-firebase/dist/modules/notifications/IOSNotification";
import { Notification, NotificationOpen } from 'react-native-firebase';
import NotifyPayload from './NotifyPayload';

export default async (message: RemoteMessage) => {
  console.log('Received message in background: ', message);
  AsyncStorage.getItem('list_notifications')
    .then(res => {
      console.log('Saving to AsyncStorage');
      let data = message.data;
      let nDetail = new NotifyPayload(data);
      if (res) {
        let tJson = JSON.parse(res);
        tJson.push(nDetail);
        AsyncStorage.setItem('list_notifications', JSON.stringify(tJson));
      } else {
        AsyncStorage.setItem('list_notifications', JSON.stringify([nDetail]));
      }
      const notification = new firebase.notifications.Notification()
        .setNotificationId('notificationId')
        .setTitle(nDetail.title)
        .setBody(nDetail.message)
        .setData(nDetail)
        .android.setChannelId('rain')
        .android.setSmallIcon('ic_launcher');

      console.log('Display notification');
      firebase.notifications()
        .displayNotification(notification);
    }).catch(error => {
      console.log('Error handling background message: ', error);
  });

  return Promise.resolve();
}