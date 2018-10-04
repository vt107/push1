import React from 'react';
import {View, Text, TouchableHighlight} from 'react-native';
import {Divider} from 'react-native-elements';

class RowNotify extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.notify) {
      let notify = this.props.notify;
      return(
        <View>
          <TouchableHighlight style={rowStyles.container} onPress={() => this.props.navigate('Detail', {key: notify.key})}
                              underlayColor='#e8e8e8'>
            <View>
              <Text style={rowStyles.mainInfo}>[{notify.topicText}] {notify.title}</Text>
              <Text style={rowStyles.time}>{notify.time}</Text>
            </View>
          </TouchableHighlight>
          <Divider style={{ backgroundColor: 'orange' }} />
        </View>
      )
    } else {
      return (<View><Text>Loading...</Text></View>)
    }
  }
}

const rowStyles = {
  container: {
    padding: 5
  },
  mainInfo: {
    fontSize: 18,
  },
  time: {
    fontSize: 12,
  }
};

export default RowNotify;