import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Game } from './src/components/Game';

export default function App() {
    return (
        <>
            <StatusBar style="light" hidden />
            <Game />
        </>
    );
}
