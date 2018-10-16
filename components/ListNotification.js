import React from 'react';
import {AsyncStorage, View, FlatList, ActivityIndicator, DeviceEventEmitter, TouchableHighlight, Text, Alert} from 'react-native';
import RowNotify from './RowNotify';

import bsStyle from '../assets/BsStyle';

class ListNotificationScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listNotify: false
    }
  }

  _getNotifications = async() => {
    try {
      const value = await AsyncStorage.getItem('list_notifications');
      if (value !== null) {
        let listNotify = JSON.parse(value);
        if (listNotify.length > 0) {
          this.setState({listNotify: listNotify.reverse()})
        } else {
          this.props.navigation.navigate('Home');
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  componentWillMount() {
    this._getNotifications().then(console.log('Get list successfully'));
  }

  componentDidMount() {
    this._isMounted = true;
    DeviceEventEmitter.addListener('notifyChange', (e) => {
      if (this._isMounted) {
        this._getNotifications().then(console.log('Updated list due to event notify change'));
      }
    })
  }

  componentWillUnmount() {
    DeviceEventEmitter.removeListener('notifyChange');
    this._isMounted = false;
  }

  static navigationOptions = {
    title: 'List',
  };

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
      this.props.navigation.navigate('Home');
    })
 }

  render() {
    const { navigate } = this.props.navigation;
    if (this.state.listNotify !== false) {
      return (
        <View style={listNotifyStyle.container}>
          <FlatList
            data={this.state.listNotify}
            renderItem={({item}) => <RowNotify notify={item} navigate={navigate}/>
            }
            keyExtractor={(item) => item.key}
          />
          <View style={{alignItems: 'center', marginTop: 10}}>
            <TouchableHighlight underlayColor="white" onPress={() => this._confirmResetNotify()}>
              <View style={[bsStyle.btn, bsStyle.btnDanger]}>
                <Text style={bsStyle.btnText}>Reset</Text>
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

export default ListNotificationScreen;

const listNotifyStyle = {
  container: {
  }
};