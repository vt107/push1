import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  AsyncStorage,
  TouchableHighlight,
  Alert,
  Linking,
  DeviceEventEmitter,
  ActivityIndicator
} from 'react-native';

import bsStyle from '../assets/BsStyle';

class ShowLink extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.link && this.props.link.length > 0) {
      return (
        <View>
          <Text>Visit below link for more detail:</Text>
          <Text style={notifyStyle.link} onPress={() => Linking.openURL(this.props.link)}>{this.props.link}</Text>
        </View>
      )
    } else {
      return null;
    }
  }
}

class NotificationDetailScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      notify: false
    }
  }

  static navigationOptions = {
    title: 'Detail',
    headerStyle: {
      backgroundColor: '#e8e8e8',
    },
    // headerTintColor: '#fff',
    headerTitleStyle: {
      fontWeight: 'bold',
    },
  };

  _confirmDeleteNotify() {
    Alert.alert(
      'Confirm delete',
      'Do you want to delete this notify?',
      [
        {text: 'Cancel', onPress: () => {}, style: 'cancel'},
        {text: 'OK', onPress: () => {
            this._deleteNotify()
              .then((listEmpty) => {
                DeviceEventEmitter.emit('notifyChange', {type: 'delete', data: {
                  key: this.state.notify.key
                }});
                this.props.navigation.navigate(listEmpty? 'Home': 'List');
              })
          }},
      ],
      { cancelable: false }
    )
  }

  _deleteNotify = async() => {
    try {
      const value = await AsyncStorage.getItem('list_notifications');
      if (value !== null) {
        let listNotify = JSON.parse(value);
        listNotify.splice(listNotify.findIndex((val) => {return val.key === this.state.notify.key}), 1);
        await AsyncStorage.setItem('list_notifications', JSON.stringify(listNotify));
        return listNotify.length === 0;
      }
    } catch (error) {
      console.log(error);
    }
  };

  componentWillMount() {
    const { navigation } = this.props;
    let notifyKey = navigation.getParam('key', false);

    if (notifyKey !== false) {
      AsyncStorage.getItem('list_notifications')
        .then(res => {
          const listNotify = JSON.parse(res);
          let thisNotify = listNotify? listNotify.find(notify => notify.key === notifyKey): false;
          if (thisNotify) {
            this.setState({notify: thisNotify});
            if (!thisNotify.seen) {
              listNotify.find(notify => notify.key === notifyKey).seen = true;
              AsyncStorage.setItem('list_notifications', JSON.stringify(listNotify))
              .then( DeviceEventEmitter.emit('notifyChange', {type: 'update_seen', data: {
                key: this.state.notify.key
              }}));
            }
          } else {
            navigation.navigate('Home');
          }
        });
    } else {
      navigation.navigate('Home');
    }
  }

  render() {
      if (this.state.notify) {
        let thisNotify = this.state.notify;
        return (
          <View>
            <View style={notifyStyle.container}>
              <Text style={notifyStyle.title}>{thisNotify.title}</Text>
              <Text style={notifyStyle.detail}>{thisNotify.message}</Text>
              <Text style={notifyStyle.topic}>Topic: {thisNotify.topicText}</Text>
              <Text style={notifyStyle.level}>Level: {thisNotify.level}</Text>
              <ShowLink link={thisNotify.link} />
            </View>

            <View style={{alignItems: 'center', marginTop: 10}}>
              <TouchableHighlight underlayColor="white" onPress={() => this._confirmDeleteNotify()}>
                <View style={[bsStyle.btn, bsStyle.btnDanger]}>
                  <Text style={bsStyle.btnText}>Delete</Text>
                </View>
              </TouchableHighlight>
            </View>
          </View>
        );
      } else {
        return (
          <View style={bsStyle.loading}>
            <ActivityIndicator size='large' color='#00ff00' />
          </View>
        )
      }
  }
}

const notifyStyle = StyleSheet.create({
  container: {
    padding: 7
  },
  title: {
    fontSize: 23,
    marginTop: 7,
    marginBottom: 7
  },
  detail: {
    fontSize: 17,
    color: '#333333',
    marginBottom: 4
  },
  topic: {

  },
  level: {

  },
  link: {
    color: 'blue',
  },
});

export default NotificationDetailScreen;