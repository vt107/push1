import React from 'react';
import { createStackNavigator } from 'react-navigation';

import HomeScreen from './components/Home.js';
import ListNotificationScreen from './components/ListNotification.js';
import NotificationDetailScreen from './components/NotificationDetail.js';

const App = createStackNavigator({
  Home: { screen: HomeScreen },
  List: { screen: ListNotificationScreen },
  Detail: { screen: NotificationDetailScreen },
});

export default App;