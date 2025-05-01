"use server";
import { NextResponse } from "next/server";
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_SCHEMA,
    waitForConnections: true
})

export async function getCategories() {
    try {
        const db = await pool.getConnection()
        const query = 'select distinct category from tabooWords'
        const [rows] = await db.execute(query)
        db.release()
        console.log(rows);
        return  rows;
    } catch (error) {
        return NextResponse.json({
            error: error
        }, { status: 500 })
    }
}

export async function getPlayedWords(selectedCategory, player) {
    try {
        let playedWords = [];

        const db = await pool.getConnection()

        const query = selectedCategory !== 'Random' ?
            'select distinct word from tabooWords where category = ' + selectedCategory + ' ORDER BY RAND() LIMIT ' + player.length :
            'select distinct word from tabooWords ORDER BY RAND() LIMIT ' + player.length;

        const [rows] = await db.execute(query)
        db.release()

        for (let i in rows) {
            playedWords.push( { memberId: player[i].memberId, member: player[i].member, word: rows[i].word } );
        }
        console.log(playedWords);
        return playedWords;
    } catch (error) {
        console.log(error);
    }
}
