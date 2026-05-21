const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process'); // สำหรับเรียกใช้สคริปต์ Python

const app = express();
const PORT = process.env.PORT || 3000;

// เปิดใช้งาน CORS และการถอดรหัส JSON
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. ให้บริการไฟล์ Static (HTML, CSS, JS, รูปภาพ) จากโฟลเดอร์หลัก
app.use(express.static(path.join(__dirname)));

// 2. ให้บริการข้อมูล JSON ผ่านพอร์ต /content ตามที่ดึงใน script.js
app.get('/content/home.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.json'));
});

app.get('/content/data.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'data.json'));
});

// 3. API สำหรับเชื่อมต่อและรับประมวลผลข้อมูลร่วมกับสคริปต์ Python (process.py)
app.post('/api/process', (req, res) => {
    const inputValue = req.body.value || 42; // รับค่าตัวเลขส่งต่อไปประมวลผล

    // เรียกใช้ process.py และส่งอาร์กิวเมนต์ตัวเลขเข้าไป
    exec(`python process.py ${inputValue}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการรัน Python' });
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
        }

        try {
            // แปลงผลลัพธ์ที่พิมพ์ออกจาก Python (JSON String) ให้เป็น Object ส่งกลับไปให้หน้าเว็บ
            const resultData = JSON.parse(stdout);
            res.json(resultData);
        } catch (e) {
            res.json({ status: 'success', raw_output: stdout.trim() });
        }
    });
});

// 4. เส้นทางหลักสำหรับแสดงหน้าแรกเมื่อเปิดเข้ามาที่ http://localhost:3000
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// เปิดการทำงานเซิร์ฟเวอร์
app.listen(PORT, () => {
    console.log(`เซิร์ฟเวอร์รันอยู่ที่: http://localhost:${PORT}`);
});