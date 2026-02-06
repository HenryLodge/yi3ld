import React from 'react';
import { Entypo } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

export default function Logo() {
  return(
    <View style={styles.triangleStack}>
      <Entypo name="triangle-down" size={42} color="#000" />
      <Entypo name="triangle-down" size={33} color="#9c9c9c" style={styles.triangleOverlay} />
    </View>
  )
}


const styles = StyleSheet.create({
  triangleStack: {
    position: 'relative',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -18,
    marginLeft: -3,
  },
  triangleOverlay: {
    position: 'absolute',
  },
});