import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Button, StatusBar, TouchableOpacity } from 'react-native';
import { Camera } from 'expo-camera';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as jpeg from 'jpeg-js';
import { fetch, decodeJpeg } from '@tensorflow/tfjs-react-native';


export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [model, setModel] = useState(null);
  const [predictions, setPredictions] = useState([]);

  // Reference to the camera
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        await tf.ready();
        const model = await tf.loadGraphModel(require('./assets/model/model.json'));
        setModel(model);
      } catch (error) {
        console.error("Error loading model:", error);
      }
  
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch (error) {
        console.error("Camera permission error:", error);
      }
    })();
  }, []);
  

  const handleOpenCamera = () => {
    setCameraOpen(true);
  };

  const handleImageCapture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      detectObjectsInImage(photo.uri);
    }
  };

  const detectObjectsInImage = async (imageUri) => {
    // Convert image to tensor
    const imageTensor = await imageToTensor(imageUri);

    if (model) {
      const predictions = await model.detect(imageTensor);
      setPredictions(predictions);
    }
  };

  const imageToTensor = async (rawImageData) => {
      const response = await fetch(rawImageData, {}, { isBinary: true });
    const imageData = await response.arrayBuffer();
    const imageTensor = decodeJpeg(imageData);
    return imageTensor;
  };

  const renderBoxes = () => {
    return predictions.map((prediction, index) => {
      const { bbox, class: objectName, score } = prediction;
      const [x, y, width, height] = bbox;

      return (
        <View key={index} style={{
          position: 'absolute',
          left: x,
          top: y,
          width: width,
          height: height,
          borderWidth: 2,
          borderColor: 'red',
          justifyContent: 'flex-end',
        }}>
          <Text style={{ color: 'red', backgroundColor: 'white' }}>
            {`${objectName} ${(score * 100).toFixed(1)}%`}
          </Text>
        </View>
      );
    });
  };

  if (cameraOpen) {
    return (
      <View style={styles.container}>
        <Camera
          style={styles.camera}
          type={Camera.Constants.Type.back}
          ref={cameraRef}
        >
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleImageCapture} style={styles.button}>
              <Text style={styles.text}> Detect Objects </Text>
            </TouchableOpacity>
          </View>
          {renderBoxes()}
        </Camera>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>NanoMatrix</Text>
      <Text style={styles.welcomeText}>Welcome Yash!</Text>
      {hasPermission === null
        ? <Text>Requesting for camera permission</Text>
        : hasPermission === false
          ? <Text>No access to camera</Text>
          : <Button title="Open Camera" onPress={handleOpenCamera} />
      }
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    margin: 20,
  },
  button: {
    flex: 0.1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: 'white',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  welcomeText: {
    marginBottom: 20,
  },
  camera: {
    width: '100%',
    height: '100%',
  },
});
