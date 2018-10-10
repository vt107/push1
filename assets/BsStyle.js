import {StyleSheet} from 'react-native';

const bsStyle = StyleSheet.create({
  btn: {
    marginBottom: 5,
    minWidth: 100,
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
    margin: 15,
    marginTop: 30,
    fontSize: 20
  },
  emptyStatus: {

  },
  textCenter: {
    textAlign: 'center'
  },
  cWhite: {
    color: 'white'
  }
});

export default bsStyle;