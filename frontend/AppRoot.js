import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import PlatformUI from './platform/PlatformUI';
import App from './App';

// Every platform renders the same screen tree; only browser integration differs.
export default function AppRoot() {
  return <PlatformUI><SafeAreaProvider style={{flex:1}}><App/></SafeAreaProvider></PlatformUI>;
}
