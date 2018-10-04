import {StyleSheet} from 'react-native';

const bsStyle = StyleSheet.create({
  btn: {
    marginBottom: 5,
    width: 200,
    alignItems: 'center',
    borderRadius: 2
  },
  btnSuccess: {
    backgroundColor: 'green'
  },
  btnInfo: {
    backgroundColor: '#2196F3'
  },
  btnDanger: {
    backgroundColor: '#dc3545',
  },
  btnText: {
    padding: 10,
    color: 'white'
  },
  emptyStatusCover: {
    alignItems: 'center',
    margin: 15
  },
  emptyStatus: {

  }
});

export default bsStyle;