import React from 'react';
import { Switch, View, Text, FlatList, AsyncStorage } from 'react-native';
import firebase from 'react-native-firebase';

export default class SettingsScreen extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      listTopic: false,
      refresh: false
    }
  }

  getListTopic() {
    return new Promise((resolve, reject) => {
      resolve([
        {key: 'rain', text: 'Japan Rain'},
        {key: 'cloud', text: 'Japan Cloud'},
        {key: 'wind', text: 'Japan Wind'},
      ]);
    });
  }

  componentWillMount() {
    AsyncStorage.getItem('topics')
      .then(res => {
        let listSubscribed = res? JSON.parse(res): [];
        console.log('list subscribed: ', listSubscribed);

        this.getListTopic()
          .then(listTopic => {
            listTopic.forEach(topic => {
              topic.subscribed = listSubscribed.indexOf(topic.key) !== -1;
            });
            this.setState({listTopic: listTopic})
          });
      });

    firebase.messaging().hasPermission()
      .then(enabled => {
        if (!enabled) {
          firebase.messaging().requestPermission()
            .then()
            .catch(this.props.navigation.navigate('Home'));
        }
      })
      .catch(error => {
        console.log(error);
      });

  }

  _handleChange(key, value) {
    if (key) {
      let listTopic = this.state.listTopic;
      let foundIndex = listTopic.findIndex(x => x.key === key);
      if (foundIndex !== -1) listTopic[foundIndex].subscribed = value;
      this.setState({listTopic: listTopic});
      this.setState({refresh: !this.state.refresh});

      // Update AsyncStorage
      let listSubsribed = [];
      listTopic.forEach(topic => {
        if (topic.subscribed) listSubsribed.push(topic.key);
      });
      AsyncStorage.setItem('topics', JSON.stringify(listSubsribed));

      if (value) {
        firebase.messaging().subscribeToTopic(key);
        console.log('Subscribed to topic: ', key);
      } else {
        firebase.messaging().unsubscribeFromTopic(key);
        console.log('UnSubscribed from topic: ', key);
      }
    }
  }

  render() {
    if (this.state.listTopic === false) {
      return (<View><Text>adsfasfas</Text></View>)
    } else {
      return (
        <View>
          <FlatList
            data={this.state.listTopic}
            renderItem={({item}) =>
              <View style={style.cover}>
                <Text style={style.text}>{item.text}</Text>
                <Switch value={item.subscribed} onValueChange={val => this._handleChange(item.key, val)} style={style.control} />
              </View>
            }
            extraData={this.state}
          />
        </View>
      )
    }

  }
}

let style = {
  cover: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'

  },
  text: {
    width: '75%'
  },
  control: {
    width: '20%'
  }
};