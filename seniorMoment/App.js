import React, { Component } from 'react';
import { AppRegistry, View, Dimensions, Button, Text, ScrollView, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { Camera, Permissions } from 'expo';
import axios from 'axios';
import { ViewPagerAndroid, DrawerLayoutAndroid, } from 'react-native-gesture-handler';
import { SQLite } from 'expo'
import { white } from 'ansi-colors';

const db = SQLite.openDatabase('db.db')

class LoadingScreen extends Component {
  render() {
    return (
      // Try setting `justifyContent` to `center`.
      // Try setting `flexDirection` to `row`.
      <View style={{
        flex: 1,
      }}>
        <View style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'stretch',
        }}>
          <View style={{width: 50, height: 50, backgroundColor: 'powderblue'}} />
          <View style={{width: 50, height: 50, backgroundColor: 'skyblue'}} />
          <View style={{height: 50, backgroundColor: 'steelblue'}} />
        </View>
      </View>
    );
  }
};

// ############################################################################################
//                                          API KEYS
// ############################################################################################
const translateApi = `https://translation.googleapis.com/language/translate/v2?key=AIzaSyBORAUjBQUZ9ZL2Ezw22lhAM9h28ZyH2Bw`;

// ############################################################################################
//                                            MAIN
// ############################################################################################
export default class UseCamera extends React.Component{ 

  // ###########################STATES########################################################
  state = {
    hasCameraPermission: null,
    direction: Camera.Constants.Type.back,
    ratio: this.setAppropriateRatio(),
    identifedAs: '',
    loading: false,
    languageCode: 'en',
  };

  // ###########################STORAGE########################################################

  //Hard-codede quotes banks

  // const 

  //each time app is opened. it has a list of activated quotes in that same active frame.
  // let

  componentDidMount() {
    db.transaction(tx => {
      tx.executeSql(
        'create table if not exists items (id integer primary key not null, quote TEXT);'
        //'drop table items'
      )
    })
  }

  saveQuote() {
   db.transaction(
      tx => {
        tx.executeSql(
          'insert into items (quote) values (?)',
          [
            "waddup"
          ]
        )
        tx.executeSql('select * from items', [], (_, (_)).then(response =>
          console.log(JSON.stringify()))
        )
      },
      null,
      this.update
    )
  }

  // ###########################CAMERA########################################################
  async componentWillMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted'});
  }

  setAppropriateRatio(){
    let { height, width } = Dimensions.get('window');
    // console.log("Height:"+height+"\tWidth:"+width);
    let a = this.reduce(height, width);
    // console.log(`${a[0]}:${a[1]}`);
    return `${a[0]}:${a[1]}`;
  }

  reduce(numerator,denominator){
    var gcd = function gcd(a,b){
      return b ? gcd(b, a%b) : a;
    };
    gcd = gcd(numerator,denominator);
    return [numerator/gcd, denominator/gcd];
  }

  // ###########################CENTER OF ACTION########################################################
  takePicture = async() => {
    if (this.camera) {
      // this.camera.pausePreview();
      this.setState((previousState, props) => ({
        loading: true
      }));

      const photo = await this.camera.takePictureAsync({ onPictureSaved: this.onPictureSaved, base64: true });

      this.identifyImage(photo.base64);
      
    } 
  };

async identifyImage(imageData){
    //local word
    let temp_word = "";
    // Initialise the Clarifai api
    const Clarifai = require('clarifai');
    const app = new Clarifai.App({
        apiKey: 'fac2e057ac404c80acabd9a413f6532e'
    });
    // Identify the image
    try{
      response = await app.models.predict(Clarifai.GENERAL_MODEL, {base64: imageData})
      temp_word = response.outputs[0].data.concepts[0].name
      console.log(response.outputs[0].data.concepts[0].name)
    } catch(err) { alert(err) }

    this.translate(temp_word);

    console.log("nice 1\n");
    //the switch case to add to db?
    switch(this.state.identifedAs){
      case "no person":
        console.log("nice 2\n");
        this.saveQuote();
        break;
      default:
        console.log("nice 3\n");
        break;
    }
    console.log("nice 4\n");
  };

  setImageIdentification(identifiedImage){
      // Dismiss the acitivty indicator
      this.setState((prevState, props) => ({
          identifedAs:identifiedImage,
          loading:false
      }));
  }

  // ###########################CAMERA########################################################

  changeLanguage(languageCode) {
      this.setState({ languageCode: languageCode });
  }

  async translate(temp_word){
    try {
      response = await axios.post(translateApi, {
        q: temp_word, //this.state.identifedAs 
        target: this.state.languageCode //this.state.languageCode
        })
      console.log(JSON.stringify(response))
      console.log(response.data.data.translations[0].translatedText)
      console.log(response.data.data.translations[0].detectedSourceLanguage)
      this.setState((prevState, props) => ({
        identifedAs:JSON.stringify(response.data.data.translations[0].translatedText),
        loading:false
      }));
    } catch (e) {}
  }

  // ############################LANGUAGE#######################################################

  render(){
    const { hasCameraPermission } = this.state;

    //Drawer views
    // ############################DRAWER#######################################################
    const leftNavigationView = (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <Text style={{ margin: 10, fontSize: 15, textAlign: 'left' }}>
          I'm in the Drawer! LEFT
        </Text>
        <Text style={{ margin: 10, fontSize: 15, textAlign: 'left'}}>
          Hey!
        </Text>
      </View>
    );

    const rightNavigationView = (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <Text style={{ margin: 10, fontSize: 15, textAlign: 'left' }}>
          Language menu
        </Text>
        <TouchableOpacity onPress={() => { this.changeLanguage('en') }}><Text style={styles.p}>Boston Tea Party</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => { this.changeLanguage('fr') }}><Text style={styles.p}>Baguette</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => { this.changeLanguage('de') }}><Text style={styles.p}>Mein Kampf</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => { this.changeLanguage('zh') }}><Text style={styles.p}>Rice</Text></TouchableOpacity>
      </View>
    );
    //End Drawer views

    if (hasCameraPermission === null) {
      return (
        <View style={{flex:1}}>
          <LoadingScreen/>
        </View>
      );
    } else if (hasCameraPermission === false) {
      return <Text>No access to camera</Text>;
    } else {
      return (
        <DrawerLayoutAndroid
          drawerWidth={200}
          drawerPosition={DrawerLayoutAndroid.positions.Left}
          renderNavigationView={() => leftNavigationView}>
          
        <DrawerLayoutAndroid
          drawerWidth={200}
          drawerPosition={DrawerLayoutAndroid.positions.Right}
          renderNavigationView={() => rightNavigationView}>
 
            <View style={{flex:1, flexDirection:'column', justifyContent:'center',}}>
              
              <Camera style={{flex:1}} type={this.state.type} ratio={this.state.ratio} ref={ref => { this.camera = ref; }}  >
                
                <View style={{flex:1, flexDirection: 'column',justifyContent: 'space-evenly', alignItems: 'stretch',}}>

                  <Text style= {{ fontSize: 40, flexDirection: "row", textAlign: 'center', 
                    backgroundColor: !!this.state.identifedAs ? 'rgba(85, 87, 91, 0.1)' : 'rgba(0,0,0,0)',
                    textShadowColor: 'rgba(255, 255, 255, 1)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 10}}>
                    {this.state.identifedAs}
                    </Text>

                {/* Here is the place we insert the random floaty words */}
                {/* </View> */}
                {/* <View }} }}> */}
                
                </View>
                <View style={{flex:1 , flexDirection: 'column', justifyContent: 'flex-end',}}>
                  <Button 
                    onPress={
                      this.takePicture
                        }
                    title="Snap!"
                    color="#841584"
                  />
                </View>
              </Camera>
            </View>
          </DrawerLayoutAndroid>
        </DrawerLayoutAndroid>
      );
    }
  }
}

// skip this line if using Create React Native App
AppRegistry.registerComponent('AwesomeProject', () => JustifyContentBasics);

const styles =  {
  container: {
      padding: 40,
      backgroundColor: '#FAFAFA',
  },
  p: {
      color: '#828280',
      lineHeight: 24
  },
  languageBar: {
      flexDirection: 'row',
      justifyContent: 'space-between'
  },
  page:{
    backgroundColor: '#FAFAFA',
  }
}


// skip this line if using Create React Native App
AppRegistry.registerComponent('AwesomeProject', () => JustifyContentBasics);