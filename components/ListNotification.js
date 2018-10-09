import React from 'react';
import {AsyncStorage, View, FlatList, Text, DeviceEventEmitter} from 'react-native';
import RowNotify from './RowNotify';

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
        </View>
      );
    } else {
      return (<View><Text>Loading...</Text></View>)
    }
  }
}

export default ListNotificationScreen;

const listNotifyStyle = {
  container: {
  }
};