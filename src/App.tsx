/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useCallback, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from "motion/react";
import { Activity, Camera, Play, Square, RefreshCcw, CheckCircle2, AlertCircle, ChevronRight, ArrowLeft, Info, Dumbbell, Flame, Shield, Footprints, User as UserIcon, Volume2, VolumeX, Wind, Zap, Target, Settings, Pause, RotateCcw, Download, FileText, LogIn, LogOut, Utensils, Heart, BarChart3, Gift, Hospital, MapPin, Calendar, Plus, Trash2, Search, ChevronLeft, Award, Clock, Star, Scan, Sun, Moon, Mountain, Bike, Map as MapIcon, Navigation, Users, Crown, MessageSquare, Share2, CreditCard, BarChart2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { Pose, Results } from "@mediapipe/pose";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { POSE_CONNECTIONS } from "@mediapipe/pose";
import confetti from 'canvas-confetti';
import { auth, db, googleProvider, signInWithPopup, onAuthStateChanged, type User, Timestamp, collection, addDoc, onSnapshot, query, where, orderBy, doc, getDoc, setDoc, deleteDoc, handleFirestoreError, OperationType, limit } from './firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie } from 'recharts';
import { COMMON_FOODS } from './data/foods';
import { MEALS } from './data/meals';

type Language = 'en' | 'zh' | 'ms';
type Theme = 'dark' | 'light';

interface WorkoutSession {
  id: string;
  exerciseId: string;
  exerciseName: string;
  date: string;
  duration: number; // in seconds
  avgAccuracy: number;
  category: string;
}

const TRANSLATIONS = {
  en: {
    systemStatus: "System Status",
    operational: "Operational",
    selectDiscipline: "Select Discipline",
    subtitle: "Choose your focus area for real-time biomechanical analysis. Our AI monitors posture, velocity, and alignment to ensure peak performance.",
    backToCategories: "Back to Categories",
    backToExercises: "Back to Exercises",
    exercisesAvailable: "exercises available",
    startWorkout: "Start Workout",
    stopWorkout: "Stop Workout",
    aiFormAnalysis: "AI Form Analysis",
    waitingForMovement: "Waiting for movement...",
    startingAnalysis: "Starting analysis...",
    feedback: "Feedback",
    accuracy: "Accuracy",
    riskLevel: "Risk Level",
    instructions: "Instructions",
    warning: "Warning",
    activeSession: "Active Session",
    lastSync: "Last Sync",
    standbyMode: "Standby Mode",
    systemStandby: "System standby. Initialize analysis to begin.",
    calibrating: "Calibrating biomechanics...",
    postureCorrected: "Posture corrected! Well done.",
    profile: "Profile",
    stats: "Statistics",
    history: "History",
    totalWorkouts: "Total Workouts",
    totalTime: "Total Time",
    avgAccuracyLabel: "Avg. Accuracy",
    noHistory: "No workout history yet. Start training!",
    minutes: "min",
    seconds: "sec",
    recentActivity: "Recent Activity",
    searchPlaceholder: "Search exercises...",
    settings: "Settings",
    analysisInterval: "Analysis Interval",
    voiceSpeed: "Voice Speed",
    dailyGoal: "Daily Goal",
    streak: "Streak",
    days: "days",
    goalReached: "Goal Reached!",
    secondsLabel: "seconds",
    normal: "Normal",
    fast: "Fast",
    slow: "Slow",
    workoutSummary: "Workout Summary",
    sessionDuration: "Session Duration",
    averageAccuracy: "Average Accuracy",
    wellDone: "Well Done!",
    keepItUp: "Keep up the great work and stay consistent.",
    finish: "Finish",
    pause: "Pause",
    resume: "Resume",
    restart: "Restart",
    downloadPDF: "Download PDF",
    workoutReport: "Workout Report",
    reportSummary: "Your session analysis is ready. Review your performance and download the detailed report.",
    exercise: "Exercise",
    duration: "Duration",
    date: "Date",
    close: "Close",
    formTips: "Form Tips",
    dashboard: "Dashboard",
    workout: "Workout",
    outdoor: "Outdoor",
    dietary: "Dietary",
    community: "Community",
    records: "Records",
    nearbyMe: "Nearby Me",
    myPoints: "MyPoints",
    premium: "Premium",
    live: "Live",
    aiAnalysis: "AI Analysis",
    nutrition: "Nutrition",
    recovery: "Recovery",
    analytics: "Analytics",
    rewards: "Rewards",
    healthcare: "Healthcare",
    mealLog: "Meal Log",
    addMeal: "Add Meal",
    recipes: "Recipes",
    warmUp: "Warm-Up",
    coolDown: "Cool-Down",
    performance: "Performance",
    vouchers: "Vouchers",
    redeem: "Redeem",
    booking: "Booking",
    findCenter: "Find Center",
    calories: "Calories",
    protein: "Protein",
    carbs: "Carbs",
    fats: "Fats",
    dailySummary: "Daily Summary",
    weeklyReport: "Weekly Report",
    monthlyReport: "Monthly Report",
    aiSummary: "AI Summary",
    points: "Points",
    availableVouchers: "Available Vouchers",
    bookAppointment: "Book Appointment",
    nearbyPartners: "Nearby Partners",
    categories: {
      "Lower Body": "Lower Body",
      "Upper Body": "Upper Body",
      "Core": "Core",
      "Cardio": "Cardio",
      "Mobility": "Mobility",
      "Balance": "Balance"
    },
    exercises: {
      "squats": { name: "Squats", desc: "Analyze depth, back posture, and knee alignment." },
      "lunges": { name: "Lunges", desc: "Monitor knee position and torso uprightness." },
      "deadlifts": { name: "Deadlifts", desc: "Check back flatness and hip hinge mechanics." },
      "glute-bridges": { name: "Glute Bridges", desc: "Evaluate hip extension and core stability." },
      "calf-raises": { name: "Calf Raises", desc: "Analyze ankle extension and balance." },
      "pushups": { name: "Pushups", desc: "Check elbow angle, core stability, and range of motion." },
      "bicep-curls": { name: "Bicep Curls", desc: "Monitor elbow flare and full range of motion." },
      "overhead-press": { name: "Overhead Press", desc: "Monitor bar path and shoulder alignment." },
      "pullups": { name: "Pullups", desc: "Evaluate chin clearance and back engagement." },
      "tricep-dips": { name: "Tricep Dips", desc: "Check elbow tracking and depth." },
      "plank": { name: "Plank", desc: "Evaluate body alignment and core engagement." },
      "crunches": { name: "Crunches", desc: "Monitor neck strain and abdominal contraction." },
      "russian-twists": { name: "Russian Twists", desc: "Analyze rotational control and posture." },
      "leg-raises": { name: "Leg Raises", desc: "Check lower back contact and leg straightness." },
      "jumping-jacks": { name: "Jumping Jacks", desc: "Analyze arm extension and leg coordination." },
      "mountain-climbers": { name: "Mountain Climbers", desc: "Check hip height and knee drive speed." },
      "burpees": { name: "Burpees", desc: "Analyze transition speed and jump height." },
      "high-knees": { name: "High Knees", desc: "Evaluate knee height and arm drive." },
      "side-lunges": { name: "Side Lunges", desc: "Monitor lateral movement and hip flexibility." },
      "diamond-pushups": { name: "Diamond Pushups", desc: "Check tricep engagement and hand placement." },
      "bicycle-crunches": { name: "Bicycle Crunches", desc: "Analyze rotational core engagement and leg extension." },
      "plank-jacks": { name: "Plank Jacks", desc: "Evaluate core stability during dynamic leg movement." },
      "downward-dog": { name: "Downward Dog", desc: "Check spinal alignment and hamstring stretch." },
      "cobra-stretch": { name: "Cobra Stretch", desc: "Monitor lumbar extension and shoulder position." },
      "cat-cow": { name: "Cat-Cow", desc: "Analyze spinal mobility and segmental control." },
      "tree-pose": { name: "Tree Pose", desc: "Evaluate balance, hip opening, and core stability." },
      "bird-dog": { name: "Bird-Dog", desc: "Check spinal neutrality and limb extension." },
      "wall-sit": { name: "Wall Sit", desc: "Monitor knee angle and back contact." },
      "pike-pushups": { name: "Pike Pushups", desc: "Analyze vertical push mechanics and shoulder stability." },
      "hollow-body": { name: "Hollow Body", desc: "Evaluate core compression and lower back contact." },
      "skater-jumps": { name: "Skater Jumps", desc: "Monitor lateral power and landing stability." }
    }
  },
  zh: {
    systemStatus: "系统状态",
    operational: "运行中",
    selectDiscipline: "选择训练项目",
    subtitle: "选择您的重点训练区域以进行实时生物力学分析。我们的AI会监控您的姿势、速度和对齐度，以确保最佳表现。",
    backToCategories: "返回分类",
    backToExercises: "返回动作选择",
    exercisesAvailable: "个可用动作",
    startWorkout: "开始训练",
    stopWorkout: "停止训练",
    aiFormAnalysis: "AI 姿势分析",
    waitingForMovement: "等待动作...",
    startingAnalysis: "正在开始分析...",
    feedback: "反馈",
    accuracy: "准确率",
    riskLevel: "风险等级",
    instructions: "指导",
    warning: "警告",
    activeSession: "当前训练",
    lastSync: "最后同步",
    standbyMode: "待机模式",
    systemStandby: "系统待机。初始化分析以开始。",
    calibrating: "校准生物力学...",
    postureCorrected: "姿势已纠正！做得好。",
    profile: "个人资料",
    stats: "统计数据",
    history: "历史记录",
    totalWorkouts: "总训练次数",
    totalTime: "总时长",
    avgAccuracyLabel: "平均准确率",
    noHistory: "暂无训练历史。开始训练吧！",
    minutes: "分钟",
    seconds: "秒",
    recentActivity: "近期活动",
    searchPlaceholder: "搜索练习...",
    settings: "设置",
    analysisInterval: "分析间隔",
    voiceSpeed: "语音速度",
    dailyGoal: "每日目标",
    streak: "连续天数",
    days: "天",
    goalReached: "目标达成！",
    secondsLabel: "秒",
    normal: "正常",
    fast: "快",
    slow: "慢",
    workoutSummary: "训练总结",
    sessionDuration: "训练时长",
    averageAccuracy: "平均准确率",
    wellDone: "做得好！",
    keepItUp: "继续加油，保持坚持。",
    finish: "完成",
    pause: "暂停",
    resume: "继续",
    restart: "重新开始",
    downloadPDF: "下载 PDF 报告",
    workoutReport: "训练报告",
    reportSummary: "您的训练分析已就绪。查看您的表现并下载详细报告。",
    exercise: "练习项目",
    duration: "时长",
    date: "日期",
    close: "关闭",
    formTips: "动作要领",
    dashboard: "仪表盘",
    workout: "训练",
    outdoor: "户外",
    dietary: "饮食",
    community: "社区",
    records: "记录",
    nearbyMe: "附近",
    myPoints: "我的积分",
    premium: "高级会员",
    live: "直播",
    aiAnalysis: "AI 分析",
    nutrition: "营养",
    recovery: "恢复",
    analytics: "分析",
    rewards: "奖励",
    healthcare: "医疗保健",
    mealLog: "饮食记录",
    addMeal: "添加饮食",
    recipes: "食谱",
    warmUp: "热身",
    coolDown: "放松",
    performance: "表现",
    vouchers: "优惠券",
    redeem: "兑换",
    booking: "预约",
    findCenter: "寻找中心",
    calories: "卡路里",
    protein: "蛋白质",
    carbs: "碳水",
    fats: "脂肪",
    dailySummary: "每日总结",
    weeklyReport: "每周报告",
    monthlyReport: "每月报告",
    aiSummary: "AI 总结",
    points: "积分",
    availableVouchers: "可用优惠券",
    bookAppointment: "预约挂号",
    nearbyPartners: "附近合作伙伴",
    categories: {
      "Lower Body": "下肢",
      "Upper Body": "上肢",
      "Core": "核心",
      "Cardio": "有氧",
      "Mobility": "柔韧性",
      "Balance": "平衡"
    },
    exercises: {
      "squats": { name: "深蹲", desc: "分析下蹲深度、背部姿势和膝盖对齐度。" },
      "lunges": { name: "弓箭步", desc: "监测膝盖位置和躯干直立度。" },
      "deadlifts": { name: "硬拉", desc: "检查背部平直度和髋部铰链机制。" },
      "glute-bridges": { name: "臀桥", desc: "评估髋部伸展和核心稳定性。" },
      "calf-raises": { name: "提踵", desc: "分析脚踝伸展和平衡。" },
      "pushups": { name: "俯卧撑", desc: "检查手肘角度、核心稳定性和动作幅度。" },
      "bicep-curls": { name: "二头弯举", desc: "监测手肘外翻和完整动作幅度。" },
      "overhead-press": { name: "推举", desc: "监测杠铃轨迹和肩膀对齐度。" },
      "pullups": { name: "引体向上", desc: "评估下巴过杠和背部发力。" },
      "tricep-dips": { name: "臂屈伸", desc: "检查手肘轨迹和下压深度。" },
      "plank": { name: "平板支撑", desc: "评估身体对齐度和核心发力。" },
      "crunches": { name: "卷腹", desc: "监测颈部拉扯和腹部收缩。" },
      "russian-twists": { name: "俄罗斯转体", desc: "分析旋转控制和姿势。" },
      "leg-raises": { name: "举腿", desc: "检查下背部贴地和腿部伸直度。" },
      "jumping-jacks": { name: "开合跳", desc: "分析手臂伸展和腿部协调。" },
      "mountain-climbers": { name: "登山跑", desc: "检查臀部高度和提膝速度。" },
      "burpees": { name: "波比跳", desc: "分析转换速度和跳跃高度。" },
      "high-knees": { name: "高抬腿", desc: "评估提膝高度和手臂摆动。" },
      "side-lunges": { name: "侧弓步", desc: "监测侧向移动和髋部灵活性。" },
      "diamond-pushups": { name: "钻石俯卧撑", desc: "检查三头肌发力和手部位置。" },
      "bicycle-crunches": { name: "单车卷腹", desc: "分析核心旋转发力和腿部伸展。" },
      "plank-jacks": { name: "平板开合跳", desc: "评估动态腿部移动时的核心稳定性。" },
      "downward-dog": { name: "下犬式", desc: "检查脊柱对齐和腿后肌拉伸。" },
      "cobra-stretch": { name: "眼镜蛇式", desc: "监测腰椎伸展和肩膀位置。" },
      "cat-cow": { name: "猫牛式", desc: "分析脊柱灵活性和分段控制。" },
      "tree-pose": { name: "树式", desc: "评估平衡、髋部打开和核心稳定性。" },
      "bird-dog": { name: "鸟狗式", desc: "检查脊柱中立和肢体伸展。" },
      "wall-sit": { name: "靠墙静蹲", desc: "监测膝盖角度和背部接触。" },
      "pike-pushups": { name: "折体俯卧撑", desc: "分析垂直推力机制和肩膀稳定性。" },
      "hollow-body": { name: "空心支撑", desc: "评估核心压缩和下背部接触。" },
      "skater-jumps": { name: "溜冰跳", desc: "监测侧向爆发力和落地稳定性。" }
    }
  },
  ms: {
    systemStatus: "Status Sistem",
    operational: "Beroperasi",
    selectDiscipline: "Pilih Disiplin",
    subtitle: "Pilih kawasan tumpuan anda untuk analisis biomekanik masa nyata. AI kami memantau postur, halaju, dan penjajaran untuk memastikan prestasi puncak.",
    backToCategories: "Kembali ke Kategori",
    backToExercises: "Kembali ke Senaman",
    exercisesAvailable: "latihan tersedia",
    startWorkout: "Mula Latihan",
    stopWorkout: "Berhenti Latihan",
    aiFormAnalysis: "Analisis Bentuk AI",
    waitingForMovement: "Menunggu pergerakan...",
    startingAnalysis: "Memulakan analisis...",
    feedback: "Maklum Balas",
    accuracy: "Ketepatan",
    riskLevel: "Tahap Risiko",
    instructions: "Arahan",
    warning: "Amaran",
    activeSession: "Sesi Aktif",
    lastSync: "Segerak Terakhir",
    standbyMode: "Mod Sedia",
    systemStandby: "Sistem sedia. Mulakan analisis.",
    calibrating: "Menentukur biomekanik...",
    postureCorrected: "Postur diperbetulkan! Syabas.",
    profile: "Profil",
    stats: "Statistik",
    history: "Sejarah",
    totalWorkouts: "Jumlah Latihan",
    totalTime: "Jumlah Masa",
    avgAccuracyLabel: "Purata Ketepatan",
    noHistory: "Tiada sejarah latihan lagi. Mula berlatih!",
    minutes: "min",
    seconds: "saat",
    recentActivity: "Aktiviti Terkini",
    searchPlaceholder: "Cari senaman...",
    settings: "Tetapan",
    analysisInterval: "Selang Analisis",
    voiceSpeed: "Kelajuan Suara",
    dailyGoal: "Matlamat Harian",
    streak: "Rentetan",
    days: "hari",
    goalReached: "Matlamat Tercapai!",
    secondsLabel: "saat",
    normal: "Normal",
    fast: "Laju",
    slow: "Perlahan",
    workoutSummary: "Ringkasan Latihan",
    sessionDuration: "Tempoh Sesi",
    averageAccuracy: "Purata Ketepatan",
    wellDone: "Syabas!",
    keepItUp: "Teruskan usaha anda dan kekal konsisten.",
    finish: "Selesai",
    pause: "Jeda",
    resume: "Sambung",
    restart: "Mula Semula",
    downloadPDF: "Muat Turun PDF",
    workoutReport: "Laporan Latihan",
    reportSummary: "Analisis sesi anda sudah sedia. Semak prestasi anda dan muat turun laporan terperinci.",
    exercise: "Senaman",
    duration: "Tempoh",
    date: "Tarikh",
    close: "Tutup",
    formTips: "Petua Bentuk",
    dashboard: "Papan Pemuka",
    workout: "Latihan",
    outdoor: "Luar",
    dietary: "Diet",
    community: "Komuniti",
    records: "Rekod",
    nearbyMe: "Berdekatan",
    myPoints: "Mata Saya",
    premium: "Premium",
    live: "Langsung",
    aiAnalysis: "Analisis AI",
    nutrition: "Pemakanan",
    recovery: "Pemulihan",
    analytics: "Analitik",
    rewards: "Ganjaran",
    healthcare: "Kesihatan",
    mealLog: "Log Makanan",
    addMeal: "Tambah Makanan",
    recipes: "Resipi",
    warmUp: "Memanaskan Badan",
    coolDown: "Menyejukkan Badan",
    performance: "Prestasi",
    vouchers: "Baucar",
    redeem: "Tebus",
    booking: "Tempahan",
    findCenter: "Cari Pusat",
    calories: "Kalori",
    protein: "Protein",
    carbs: "Karbohidrat",
    fats: "Lemak",
    dailySummary: "Ringkasan Harian",
    weeklyReport: "Laporan Mingguan",
    monthlyReport: "Laporan Bulanan",
    aiSummary: "Ringkasan AI",
    points: "Mata",
    availableVouchers: "Baucar Tersedia",
    bookAppointment: "Tempah Temujanji",
    nearbyPartners: "Rakan Kongsi Berdekatan",
    categories: {
      "Lower Body": "Badan Bawah",
      "Upper Body": "Badan Atas",
      "Core": "Teras",
      "Cardio": "Kardio",
      "Mobility": "Mobiliti",
      "Balance": "Keseimbangan"
    },
    exercises: {
      "squats": { name: "Cangkung", desc: "Analisis kedalaman, postur belakang, dan penjajaran lutut." },
      "lunges": { name: "Lunge", desc: "Pantau kedudukan lutut dan ketegakan badan." },
      "deadlifts": { name: "Angkat Berat", desc: "Periksa kerataan belakang dan mekanik engsel pinggul." },
      "glute-bridges": { name: "Jambatan Glute", desc: "Nilai sambungan pinggul dan kestabilan teras." },
      "calf-raises": { name: "Angkat Betis", desc: "Analisis sambungan buku lali dan keseimbangan." },
      "pushups": { name: "Tekan Tubi", desc: "Periksa sudut siku, kestabilan teras, dan julat pergerakan." },
      "bicep-curls": { name: "Lentur Bicep", desc: "Pantau siku dan julat pergerakan penuh." },
      "overhead-press": { name: "Tekanan Atas Kepala", desc: "Pantau laluan bar dan penjajaran bahu." },
      "pullups": { name: "Tarik Badan", desc: "Nilai pelepasan dagu dan penglibatan belakang." },
      "tricep-dips": { name: "Celupan Tricep", desc: "Periksa laluan siku dan kedalaman." },
      "plank": { name: "Plank", desc: "Nilai penjajaran badan dan penglibatan teras." },
      "crunches": { name: "Crunch", desc: "Pantau ketegangan leher dan pengecutan perut." },
      "russian-twists": { name: "Pusingan Rusia", desc: "Analisis kawalan putaran dan postur." },
      "leg-raises": { name: "Angkat Kaki", desc: "Periksa sentuhan belakang bawah dan kelurusan kaki." },
      "jumping-jacks": { name: "Lompat Bintang", desc: "Analisis sambungan lengan dan koordinasi kaki." },
      "mountain-climbers": { name: "Pendaki Gunung", desc: "Periksa ketinggian pinggul dan kelajuan lutut." },
      "burpees": { name: "Burpee", desc: "Analisis kelajuan peralihan dan ketinggian lompatan." },
      "high-knees": { name: "Lutut Tinggi", desc: "Nilai ketinggian lutut dan ayunan lengan." },
      "side-lunges": { name: "Lunge Sisi", desc: "Pantau pergerakan sisi dan fleksibiliti pinggul." },
      "diamond-pushups": { name: "Tekan Tubi Berlian", desc: "Periksa penglibatan tricep dan kedudukan tangan." },
      "bicycle-crunches": { name: "Crunch Basikal", desc: "Analisis penglibatan teras putaran dan sambungan kaki." },
      "plank-jacks": { name: "Plank Jack", desc: "Nilai kestabilan teras semasa pergerakan kaki dinamik." },
      "downward-dog": { name: "Downward Dog", desc: "Periksa penjajaran tulang belakang dan regangan hamstring." },
      "cobra-stretch": { name: "Regangan Cobra", desc: "Pantau sambungan lumbar dan kedudukan bahu." },
      "cat-cow": { name: "Cat-Cow", desc: "Analisis mobiliti tulang belakang dan kawalan segmental." },
      "tree-pose": { name: "Pose Pokok", desc: "Nilai keseimbangan, pembukaan pinggul, dan kestabilan teras." },
      "bird-dog": { name: "Bird-Dog", desc: "Periksa kenetralan tulang belakang dan sambungan anggota badan." },
      "wall-sit": { name: "Duduk Dinding", desc: "Pantau sudut lutut dan sentuhan belakang." },
      "pike-pushups": { name: "Tekan Tubi Pike", desc: "Analisis mekanik tolak menegak dan kestabilan bahu." },
      "hollow-body": { name: "Badan Hollow", desc: "Nilai mampatan teras dan sentuhan belakang bawah." },
      "skater-jumps": { name: "Lompatan Skater", desc: "Pantau kuasa sisi dan kestabilan pendaratan." }
    }
  }
};

const FORM_TIPS: Record<string, string[]> = {
  squats: ["Keep chest up", "Weight on heels", "Knees behind toes", "Core engaged"],
  pushups: ["Tight core", "Elbows at 45°", "Full range of motion", "Neutral neck"],
  lunges: ["Torso upright", "90° knee angles", "Front knee over ankle", "Core stable"],
  plank: ["Flat back", "Engage glutes", "Shoulders over elbows", "Neutral neck"],
  deadlifts: ["Flat back", "Hinge at hips", "Bar close to shins", "Engage lats"],
  "glute-bridges": ["Squeeze glutes", "Heels close to hips", "Core tight", "Full extension"],
  "bicep-curls": ["Elbows tucked", "No swinging", "Full extension", "Controlled tempo"],
  "overhead-press": ["Core tight", "Full lockout", "Neutral spine", "Vertical bar path"],
  pullups: ["Chest to bar", "Full hang", "Engage lats", "No kipping"],
  "russian-twists": ["Chest up", "Rotate torso", "Controlled movement", "Heels off floor"],
  "mountain-climbers": ["Flat back", "Drive knees", "Shoulders over wrists", "Quick tempo"],
  burpees: ["Full plank", "Explosive jump", "Soft landing", "Quick transitions"]
};

const PARTNERS = [
  { id: 'p1', name: 'Penang Physio Care', type: 'Physiotherapy', address: 'Gurney Drive, George Town', rating: 4.8, distance: '2.5 km', lat: 5.432, lng: 100.312 },
  { id: 'p2', name: 'Island Health Hospital', type: 'Hospital', address: 'Macalister Road, George Town', rating: 4.9, distance: '4.1 km', lat: 5.415, lng: 100.305 },
  { id: 'p3', name: 'Elite Sports Recovery', type: 'Recovery Center', address: 'Bayan Lepas', rating: 4.7, distance: '12.0 km', lat: 5.295, lng: 100.259 },
  { id: 'p4', name: 'Gleneagles Hospital Penang', type: 'Hospital', address: 'Pangkor Road, George Town', rating: 4.8, distance: '3.2 km', lat: 5.426, lng: 100.319 },
  { id: 'p5', name: 'Loh Guan Lye Specialists Centre', type: 'Hospital', address: 'Macalister Road, George Town', rating: 4.7, distance: '4.5 km', lat: 5.414, lng: 100.317 },
  { id: 'p6', name: 'Pantai Hospital Penang', type: 'Hospital', address: 'Bayan Baru', rating: 4.6, distance: '14.2 km', lat: 5.322, lng: 100.285 },
  { id: 'p7', name: 'KPJ Penang Specialist Hospital', type: 'Hospital', address: 'Bandar Perda, Bukit Mertajam', rating: 4.7, distance: '22.5 km', lat: 5.371, lng: 100.441 },
  { id: 'p8', name: 'Bagan Specialist Centre', type: 'Hospital', address: 'Jalan Bagan Satu, Butterworth', rating: 4.5, distance: '18.0 km', lat: 5.411, lng: 100.372 },
  { id: 'p9', name: 'PhysioGo Tanjung Tokong', type: 'Physiotherapy', address: 'Tanjung Tokong', rating: 4.9, distance: '5.8 km', lat: 5.451, lng: 100.306 },
  { id: 'p10', name: 'Your Physio Bayan Lepas', type: 'Physiotherapy', address: 'Bayan Lepas', rating: 4.8, distance: '13.5 km', lat: 5.328, lng: 100.274 },
  { id: 'p11', name: 'Constant Rehab George Town', type: 'Physiotherapy', address: 'Jalan Burma, George Town', rating: 4.7, distance: '3.8 km', lat: 5.421, lng: 100.322 },
  { id: 'p12', name: 'ReGen Rehab Hospital', type: 'Recovery Center', address: 'Bayan Lepas', rating: 4.8, distance: '15.0 km', lat: 5.291, lng: 100.265 },
];

const REWARDS = [
  { id: 'v1', name: 'RM10 TNG eWallet Voucher', cost: 1000, provider: 'Touch \'n Go', icon: Gift, category: 'Cash' },
  { id: 'v2', name: '1 Month Premium Subscription', cost: 5000, provider: 'FitForm', icon: Award, category: 'Service' },
  { id: 'v3', name: 'Fitbit Discount Coupon', cost: 2500, provider: 'Fitbit', icon: Zap, category: 'Gadget' },
  { id: 'v4', name: 'RM15 Starbucks Voucher', cost: 1500, provider: 'Starbucks', icon: Utensils, category: 'F&B' },
  { id: 'v5', name: 'RM20 GrabFood Voucher', cost: 2000, provider: 'GrabFood', icon: Utensils, category: 'F&B' },
  { id: 'v6', name: 'Free Healthy Bowl', cost: 1800, provider: 'The Salad Bar', icon: Heart, category: 'F&B' },
  { id: 'v7', name: 'RM10 Juice Works Voucher', cost: 800, provider: 'Juice Works', icon: Flame, category: 'F&B' },
  { id: 'v8', name: 'RM25 Nando\'s Voucher', cost: 2500, provider: 'Nando\'s', icon: Utensils, category: 'F&B' },
];

const OUTDOOR_ACTIVITIES = [
  {
    id: 'climbing',
    name: 'Outdoor Climbing',
    type: 'Climbing',
    icon: Mountain,
    description: 'Conquer the heights with our recommended climbing spots. Track your ascent and earn rewards.',
    routes: [
      { id: 'r1', name: 'Batu Caves Crag', location: 'Batu Caves, Selangor', lat: 3.2374, lng: 101.6848, difficulty: 'Intermediate', distance: 2 },
      { id: 'r2', name: 'Bukit Takun', location: 'Rawang, Selangor', lat: 3.2986, lng: 101.6444, difficulty: 'Advanced', distance: 5 },
      { id: 'r3', name: 'Bukit Keteri', location: 'Perlis', lat: 6.4833, lng: 100.1833, difficulty: 'Expert', distance: 3 }
    ]
  },
  {
    id: 'cycling',
    name: 'City Cycling',
    type: 'Cycling',
    icon: Bike,
    description: 'Explore the city on two wheels. Follow our curated routes for the best experience.',
    routes: [
      { id: 'r4', name: 'Putrajaya Loop', location: 'Putrajaya', lat: 2.9264, lng: 101.6964, distance: 20, difficulty: 'Easy' },
      { id: 'r5', name: 'Gurney Drive Coastal', location: 'Penang', lat: 5.432, lng: 100.312, distance: 10, difficulty: 'Easy' },
      { id: 'r6', name: 'FRIM Forest Loop', location: 'Kepong, KL', lat: 3.2361, lng: 101.6347, distance: 15, difficulty: 'Moderate' }
    ]
  },
  {
    id: 'running',
    name: 'Trail Running',
    type: 'Running',
    icon: Footprints,
    description: 'Hit the trails and track your runs. Discover scenic routes and challenge your personal best.',
    routes: [
      { id: 'r7', name: 'MacRitchie Reservoir', location: 'Singapore', lat: 1.3343, lng: 103.8221, distance: 11, difficulty: 'Intermediate' },
      { id: 'r8', name: 'Bukit Kiara Trails', location: 'Kuala Lumpur', lat: 3.1412, lng: 101.6321, distance: 8, difficulty: 'Moderate' },
      { id: 'r9', name: 'Penang Hill Heritage Trail', location: 'Penang', lat: 5.4244, lng: 100.2689, distance: 5, difficulty: 'Advanced' },
      { id: 'r10', name: 'KLCC Park Loop', location: 'Kuala Lumpur', lat: 3.1581, lng: 101.7143, distance: 1.3, difficulty: 'Easy' },
      { id: 'r11', name: 'Desa ParkCity', location: 'Kuala Lumpur', lat: 3.1869, lng: 101.6294, distance: 2.2, difficulty: 'Easy' }
    ]
  }
];

const RECOVERY_ROUTINES = [
  { 
    id: 'w1', 
    name: 'Full Body Warm-Up', 
    duration: '5 min', 
    exercises: [
      { name: 'Jumping Jacks', duration: 30, guidance: 'Keep a steady pace, land softly on your toes.' },
      { name: 'Arm Circles', duration: 30, guidance: 'Start with small circles, gradually making them larger.' },
      { name: 'High Knees', duration: 30, guidance: 'Drive your knees up to your chest, pump your arms.' },
      { name: 'Torso Twists', duration: 30, guidance: 'Keep your hips facing forward, twist from your core.' },
      { name: 'Leg Swings', duration: 30, guidance: 'Hold onto a wall for balance, swing leg forward and back.' }
    ] 
  },
  { 
    id: 'w2', 
    name: 'Lower Body Warm-Up', 
    duration: '4 min', 
    exercises: [
      { name: 'Bodyweight Squats', duration: 45, guidance: 'Keep your chest up, push your hips back.' },
      { name: 'Walking Lunges', duration: 45, guidance: 'Step forward, lower your back knee towards the ground.' },
      { name: 'Hip Circles', duration: 30, guidance: 'Make large circles with your hips to loosen the joints.' },
      { name: 'Ankle Bounces', duration: 30, guidance: 'Lightly bounce on the balls of your feet.' }
    ] 
  },
  { 
    id: 'c1', 
    name: 'Full Body Cool-Down', 
    duration: '6 min', 
    exercises: [
      { name: 'Child\'s Pose', duration: 60, guidance: 'Sit back on your heels, stretch your arms forward, relax your back.' },
      { name: 'Cobra Stretch', duration: 45, guidance: 'Lie on your stomach, push your chest up, keep hips on the floor.' },
      { name: 'Hamstring Stretch', duration: 45, guidance: 'Reach for your toes, keep your legs straight but not locked.' },
      { name: 'Quad Stretch', duration: 45, guidance: 'Pull your heel to your glute, keep your knees together.' },
      { name: 'Shoulder Stretch', duration: 30, guidance: 'Pull one arm across your chest, hold gently.' }
    ] 
  },
  { 
    id: 'c2', 
    name: 'Lower Body Cool-Down', 
    duration: '5 min', 
    exercises: [
      { name: 'Pigeon Pose', duration: 60, guidance: 'Bring one knee forward, extend the other leg back, lean forward.' },
      { name: 'Calf Stretch', duration: 45, guidance: 'Press your heel into the ground, lean against a wall.' },
      { name: 'Butterfly Stretch', duration: 45, guidance: 'Bring soles of feet together, gently press knees down.' },
      { name: 'Lying Spinal Twist', duration: 60, guidance: 'Lie on your back, drop knees to one side, look the opposite way.' }
    ] 
  }
];

const ExerciseSymbol = ({ id, className = "" }: { id: string, className?: string }) => {
  const svgProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className
  };

  const symbols: Record<string, React.ReactNode> = {
    squats: (
      <svg {...svgProps}>
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4l-4 3v5" />
        <path d="M12 11l4 3v5" />
        <path d="M8 14h8" />
      </svg>
    ),
    pushups: (
      <svg {...svgProps}>
        <circle cx="19" cy="7" r="2" />
        <path d="M5 17l14-4" />
        <path d="M7 17v-4" />
        <path d="M15 14v-4" />
      </svg>
    ),
    lunges: (
      <svg {...svgProps}>
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4l-5 2v5" />
        <path d="M12 11l6 4-2 4" />
      </svg>
    ),
    plank: (
      <svg {...svgProps}>
        <circle cx="19" cy="10" r="2" />
        <path d="M4 15h15" />
        <path d="M6 15v-3" />
        <path d="M17 15v-3" />
      </svg>
    ),
  };

  return (
    <motion.div
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className={className}
    >
      {symbols[id] || <Activity {...svgProps} />}
    </motion.div>
  );
};

const EXERCISES = [
  // No Equipment (Bodyweight)
  { id: 'standard-pushups', name: 'Standard Push-ups', category: 'No Equipment', targetMuscle: 'Chest', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/pushups/400/300', videoUrl: 'https://www.youtube.com/embed/IODxDxX7oi4' },
  { id: 'wide-pushups', name: 'Wide Push-ups', category: 'No Equipment', targetMuscle: 'Chest', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/widepushups/400/300', videoUrl: 'https://www.youtube.com/embed/Xp0S7Sut7p8' },
  { id: 'diamond-pushups', name: 'Diamond Push-ups', category: 'No Equipment', targetMuscle: 'Chest', difficulty: 'Advanced', imageUrl: 'https://picsum.photos/seed/diamondpushups/400/300', videoUrl: 'https://www.youtube.com/embed/J0DnG1_S92I' },
  { id: 'decline-pushups', name: 'Decline Push-ups', category: 'No Equipment', targetMuscle: 'Chest', difficulty: 'Advanced', imageUrl: 'https://picsum.photos/seed/declinepushups/400/300', videoUrl: 'https://www.youtube.com/embed/SKPab2YC8BE' },
  { id: 'incline-pushups', name: 'Incline Push-ups', category: 'No Equipment', targetMuscle: 'Chest', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/inclinepushups/400/300', videoUrl: 'https://www.youtube.com/embed/Me9i6pS99v8' },
  { id: 'pike-pushups', name: 'Pike Push-ups', category: 'No Equipment', targetMuscle: 'Chest', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/pikepushups/400/300', videoUrl: 'https://www.youtube.com/embed/sposDXWEB0A' },
  { id: 'chair-tricep-dips', name: 'Chair Tricep Dips', category: 'No Equipment', targetMuscle: 'Chest', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/tricepdips/400/300', videoUrl: 'https://www.youtube.com/embed/6kALZiktrLc' },
  { id: 'plank-to-pushup', name: 'Plank to Push-up', category: 'No Equipment', targetMuscle: 'Chest', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/plankpushup/400/300', videoUrl: 'https://www.youtube.com/embed/y_99E_f0XvI' },
  { id: 'superman-holds', name: 'Superman Holds', category: 'No Equipment', targetMuscle: 'Back', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/superman/400/300', videoUrl: 'https://www.youtube.com/embed/z6PJMT2y8GQ' },
  { id: 'reverse-snow-angels', name: 'Reverse Snow Angels', category: 'No Equipment', targetMuscle: 'Back', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/snowangels/400/300', videoUrl: 'https://www.youtube.com/embed/vG6L86-23y4' },
  { id: 'inchworms', name: 'Inchworms', category: 'No Equipment', targetMuscle: 'Back', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/inchworms/400/300', videoUrl: 'https://www.youtube.com/embed/ZY2giABKW_c' },
  { id: 'prone-swimmers', name: 'Prone Swimmers', category: 'No Equipment', targetMuscle: 'Back', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/swimmers/400/300', videoUrl: 'https://www.youtube.com/embed/7Vp9-22-LpU' },
  { id: 'bird-dog', name: 'Bird-Dog', category: 'No Equipment', targetMuscle: 'Back', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/birddog/400/300', videoUrl: 'https://www.youtube.com/embed/wiFNA3sqjCA' },
  { id: 'bodyweight-squats', name: 'Bodyweight Squats', category: 'No Equipment', targetMuscle: 'Legs', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/squats/400/300', videoUrl: 'https://www.youtube.com/embed/aclHkVaku9U' },
  { id: 'jump-squats', name: 'Jump Squats', category: 'No Equipment', targetMuscle: 'Legs', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/jumpsquats/400/300', videoUrl: 'https://www.youtube.com/embed/72BSZupbCP4' },
  { id: 'forward-lunges', name: 'Forward Lunges', category: 'No Equipment', targetMuscle: 'Legs', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/lunges/400/300', videoUrl: 'https://www.youtube.com/embed/QOVaHwm-Q6U' },
  { id: 'reverse-lunges', name: 'Reverse Lunges', category: 'No Equipment', targetMuscle: 'Legs', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/reverselunges/400/300', videoUrl: 'https://www.youtube.com/embed/O-L7M_G-U-M' },
  { id: 'walking-lunges', name: 'Walking Lunges', category: 'No Equipment', targetMuscle: 'Legs', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/walkinglunges/400/300', videoUrl: 'https://www.youtube.com/embed/L8fySubz_8M' },
  { id: 'curtsy-lunges', name: 'Curtsy Lunges', category: 'No Equipment', targetMuscle: 'Legs', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/curtsylunges/400/300', videoUrl: 'https://www.youtube.com/embed/v9Zp0s6X-sE' },
  { id: 'glute-bridges', name: 'Glute Bridges', category: 'No Equipment', targetMuscle: 'Legs', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/glutebridges/400/300', videoUrl: 'https://www.youtube.com/embed/wPM8icPu6H8' },
  { id: 'single-leg-glute-bridges', name: 'Single-Leg Glute Bridges', category: 'No Equipment', targetMuscle: 'Legs', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/slglutebridges/400/300', videoUrl: 'https://www.youtube.com/embed/67p_I9qXy-M' },
  { id: 'standing-calf-raises', name: 'Standing Calf Raises', category: 'No Equipment', targetMuscle: 'Legs', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/calfraises/400/300', videoUrl: 'https://www.youtube.com/embed/gwLzBJYoWl4' },
  { id: 'donkey-kicks', name: 'Donkey Kicks', category: 'No Equipment', targetMuscle: 'Legs', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/donkeykicks/400/300', videoUrl: 'https://www.youtube.com/embed/4ranVQDqlaE' },
  { id: 'fire-hydrants', name: 'Fire Hydrants', category: 'No Equipment', targetMuscle: 'Legs', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/firehydrants/400/300', videoUrl: 'https://www.youtube.com/embed/2_u8S99u_XU' },
  { id: 'wall-sit', name: 'Wall Sit', category: 'No Equipment', targetMuscle: 'Legs', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/wallsit/400/300', videoUrl: 'https://www.youtube.com/embed/y-wV4Venusw' },
  { id: 'forearm-plank', name: 'Forearm Plank', category: 'No Equipment', targetMuscle: 'Core', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/plank/400/300', videoUrl: 'https://www.youtube.com/embed/ASdvN_XEl_c' },
  { id: 'high-plank', name: 'High Plank', category: 'No Equipment', targetMuscle: 'Core', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/highplank/400/300', videoUrl: 'https://www.youtube.com/embed/6Lp9S_0_p_E' },
  { id: 'side-plank', name: 'Side Plank', category: 'No Equipment', targetMuscle: 'Core', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/sideplank/400/300', videoUrl: 'https://www.youtube.com/embed/NXr4FwkuCu0' },
  { id: 'bicycle-crunches', name: 'Bicycle Crunches', category: 'No Equipment', targetMuscle: 'Core', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/bicyclecrunches/400/300', videoUrl: 'https://www.youtube.com/embed/9FGilxCbdz8' },
  { id: 'russian-twists', name: 'Russian Twists', category: 'No Equipment', targetMuscle: 'Core', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/russiantwists/400/300', videoUrl: 'https://www.youtube.com/embed/wkD8rjkodUI' },
  { id: 'lying-leg-raises', name: 'Lying Leg Raises', category: 'No Equipment', targetMuscle: 'Core', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/legraises/400/300', videoUrl: 'https://www.youtube.com/embed/l4kQd9eWclE' },
  { id: 'mountain-climbers', name: 'Mountain Climbers', category: 'No Equipment', targetMuscle: 'Core', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/mountainclimbers/400/300', videoUrl: 'https://www.youtube.com/embed/zT-9L37Re98' },
  { id: 'dead-bug', name: 'Dead Bug', category: 'No Equipment', targetMuscle: 'Core', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/deadbug/400/300', videoUrl: 'https://www.youtube.com/embed/g_BYB0R-4Ws' },
  { id: 'v-ups', name: 'V-Ups', category: 'No Equipment', targetMuscle: 'Core', difficulty: 'Advanced', imageUrl: 'https://picsum.photos/seed/vups/400/300', videoUrl: 'https://www.youtube.com/embed/iP2fjvG0g3w' },
  { id: 'flutter-kicks', name: 'Flutter Kicks', category: 'No Equipment', targetMuscle: 'Core', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/flutterkicks/400/300', videoUrl: 'https://www.youtube.com/embed/ANVdMDaYRts' },
  { id: 'heel-touches', name: 'Heel Touches', category: 'No Equipment', targetMuscle: 'Core', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/heeltouches/400/300', videoUrl: 'https://www.youtube.com/embed/9bR-7ZstC_8' },
  { id: 'standard-crunches', name: 'Standard Crunches', category: 'No Equipment', targetMuscle: 'Core', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/crunches/400/300', videoUrl: 'https://www.youtube.com/embed/Xyd_fa5zoEU' },
  { id: 'burpees', name: 'Burpees', category: 'No Equipment', targetMuscle: 'Full Body', difficulty: 'Advanced', imageUrl: 'https://picsum.photos/seed/burpees/400/300', videoUrl: 'https://www.youtube.com/embed/dZfeV7UAxS8' },
  { id: 'jumping-jacks', name: 'Jumping Jacks', category: 'No Equipment', targetMuscle: 'Full Body', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/jumpingjacks/400/300', videoUrl: 'https://www.youtube.com/embed/nGaXj3kkmss' },
  { id: 'high-knees', name: 'High Knees', category: 'No Equipment', targetMuscle: 'Full Body', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/highknees/400/300', videoUrl: 'https://www.youtube.com/embed/ZNDHivU7vvc' },
  { id: 'skaters', name: 'Skaters', category: 'No Equipment', targetMuscle: 'Full Body', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/skaters/400/300', videoUrl: 'https://www.youtube.com/embed/Vp9_G796j-c' },
  { id: 'butt-kicks', name: 'Butt Kicks', category: 'No Equipment', targetMuscle: 'Full Body', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/buttkicks/400/300', videoUrl: 'https://www.youtube.com/embed/v_M2_S_QY_U' },
  { id: 'bear-crawls', name: 'Bear Crawls', category: 'No Equipment', targetMuscle: 'Full Body', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/bearcrawls/400/300', videoUrl: 'https://www.youtube.com/embed/L_4_m6_7_78' },

  // With Equipment (Gym/Weights)
  { id: 'barbell-bench-press', name: 'Barbell Bench Press', category: 'With Equipment', targetMuscle: 'Chest', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/benchpress/400/300', videoUrl: 'https://www.youtube.com/embed/rT7DgCr-3pg' },
  { id: 'dumbbell-bench-press', name: 'Dumbbell Bench Press', category: 'With Equipment', targetMuscle: 'Chest', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/dbbench/400/300', videoUrl: 'https://www.youtube.com/embed/VmB1G1K7v94' },
  { id: 'incline-dumbbell-press', name: 'Incline Dumbbell Press', category: 'With Equipment', targetMuscle: 'Chest', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/inclinedb/400/300', videoUrl: 'https://www.youtube.com/embed/8iPEnn-ltC8' },
  { id: 'decline-barbell-press', name: 'Decline Barbell Press', category: 'With Equipment', targetMuscle: 'Chest', difficulty: 'Advanced', imageUrl: 'https://picsum.photos/seed/declinebb/400/300', videoUrl: 'https://www.youtube.com/embed/LfyQBUKR8SE' },
  { id: 'cable-crossovers', name: 'Cable Crossovers', category: 'With Equipment', targetMuscle: 'Chest', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/cables/400/300', videoUrl: 'https://www.youtube.com/embed/W7In4XUX6u8' },
  { id: 'barbell-rows', name: 'Barbell Rows', category: 'With Equipment', targetMuscle: 'Back', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/bbrows/400/300', videoUrl: 'https://www.youtube.com/embed/9efgcAjQW70' },
  { id: 'lat-pulldowns', name: 'Lat Pulldowns', category: 'With Equipment', targetMuscle: 'Back', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/latpulldown/400/300', videoUrl: 'https://www.youtube.com/embed/CAwf7n6Luuc' },
  { id: 'seated-cable-rows', name: 'Seated Cable Rows', category: 'With Equipment', targetMuscle: 'Back', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/seatedrows/400/300', videoUrl: 'https://www.youtube.com/embed/GZbfZ033f74' },
  { id: 'deadlifts', name: 'Deadlifts', category: 'With Equipment', targetMuscle: 'Back', difficulty: 'Advanced', imageUrl: 'https://picsum.photos/seed/deadlifts/400/300', videoUrl: 'https://www.youtube.com/embed/ytGaGIn3SjE' },
  { id: 'barbell-squats', name: 'Barbell Squats', category: 'With Equipment', targetMuscle: 'Legs', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/bbsquats/400/300', videoUrl: 'https://www.youtube.com/embed/SW_C1A-rejs' },
  { id: 'leg-press', name: 'Leg Press', category: 'With Equipment', targetMuscle: 'Legs', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/legpress/400/300', videoUrl: 'https://www.youtube.com/embed/IZxyjW7MPJQ' },
  { id: 'leg-extensions', name: 'Leg Extensions', category: 'With Equipment', targetMuscle: 'Legs', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/legext/400/300', videoUrl: 'https://www.youtube.com/embed/YyvSfVLYd80' },
  { id: 'leg-curls', name: 'Leg Curls', category: 'With Equipment', targetMuscle: 'Legs', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/legcurls/400/300', videoUrl: 'https://www.youtube.com/embed/1Tq3QdYUuHs' },
  { id: 'dumbbell-lunges', name: 'Dumbbell Lunges', category: 'With Equipment', targetMuscle: 'Legs', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/dblunges/400/300', videoUrl: 'https://www.youtube.com/embed/D7KaRcUTQeE' },
  { id: 'overhead-press', name: 'Overhead Press', category: 'With Equipment', targetMuscle: 'Shoulders', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/ohpress/400/300', videoUrl: 'https://www.youtube.com/embed/2yjwxtZ46rg' },
  { id: 'lateral-raises', name: 'Lateral Raises', category: 'With Equipment', targetMuscle: 'Shoulders', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/latraises/400/300', videoUrl: 'https://www.youtube.com/embed/3VcKaXpzqRo' },
  { id: 'front-raises', name: 'Front Raises', category: 'With Equipment', targetMuscle: 'Shoulders', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/frontraises/400/300', videoUrl: 'https://www.youtube.com/embed/hRJ6EB_p-28' },
  { id: 'face-pulls', name: 'Face Pulls', category: 'With Equipment', targetMuscle: 'Shoulders', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/facepulls/400/300', videoUrl: 'https://www.youtube.com/embed/V8dZ3pyiCBo' },
  { id: 'bicep-curls', name: 'Bicep Curls', category: 'With Equipment', targetMuscle: 'Arms', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/curls/400/300', videoUrl: 'https://www.youtube.com/embed/ykJmrZ5v0Oo' },
  { id: 'hammer-curls', name: 'Hammer Curls', category: 'With Equipment', targetMuscle: 'Arms', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/hammercurls/400/300', videoUrl: 'https://www.youtube.com/embed/TwD-YGVP4Bk' },
  { id: 'tricep-pushdowns', name: 'Tricep Pushdowns', category: 'With Equipment', targetMuscle: 'Arms', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/pushdowns/400/300', videoUrl: 'https://www.youtube.com/embed/2-LAMcpzHLU' },
  { id: 'skull-crushers', name: 'Skull Crushers', category: 'With Equipment', targetMuscle: 'Arms', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/skullcrushers/400/300', videoUrl: 'https://www.youtube.com/embed/d_KZxPboZas' },
  { id: 'machine-chest-press', name: 'Machine Chest Press', category: 'With Equipment', targetMuscle: 'Chest', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/machinepress/400/300', videoUrl: 'https://www.youtube.com/embed/Z57CtZp6E9Q' },
  { id: 'dumbbell-flyes', name: 'Dumbbell Flyes', category: 'With Equipment', targetMuscle: 'Chest', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/dbflyes/400/300', videoUrl: 'https://www.youtube.com/embed/eGjt4lk6gTY' },
  { id: 'pec-deck-flyes', name: 'Pec Deck Flyes', category: 'With Equipment', targetMuscle: 'Chest', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/pecdeck/400/300', videoUrl: 'https://www.youtube.com/embed/O-L7M_G-U-M' },
  { id: 'barbell-bent-over-rows', name: 'Barbell Bent-Over Rows', category: 'With Equipment', targetMuscle: 'Back', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/bbrows/400/300', videoUrl: 'https://www.youtube.com/embed/9efgcAjQW70' },
  { id: 'dumbbell-single-arm-rows', name: 'Dumbbell Single-Arm Rows', category: 'With Equipment', targetMuscle: 'Back', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/dbrows/400/300', videoUrl: 'https://www.youtube.com/embed/dFzUjzfih7k' },
  { id: 'pull-ups', name: 'Pull-ups', category: 'With Equipment', targetMuscle: 'Back', difficulty: 'Advanced', imageUrl: 'https://picsum.photos/seed/pullups/400/300', videoUrl: 'https://www.youtube.com/embed/eGo4IYlbE5g' },
  { id: 'chin-ups', name: 'Chin-ups', category: 'With Equipment', targetMuscle: 'Back', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/chinups/400/300', videoUrl: 'https://www.youtube.com/embed/XlYI7QW_I_I' },
  { id: 't-bar-rows', name: 'T-Bar Rows', category: 'With Equipment', targetMuscle: 'Back', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/tbarrows/400/300', videoUrl: 'https://www.youtube.com/embed/j3Igk5nyZE4' },
  { id: 'straight-arm-pulldowns', name: 'Straight-Arm Pulldowns', category: 'With Equipment', targetMuscle: 'Back', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/straightarm/400/300', videoUrl: 'https://www.youtube.com/embed/fS_GvP_v978' },
  { id: 'barbell-back-squats', name: 'Barbell Back Squats', category: 'With Equipment', targetMuscle: 'Legs', difficulty: 'Advanced', imageUrl: 'https://picsum.photos/seed/bbsquats/400/300', videoUrl: 'https://www.youtube.com/embed/SW_C1A-rejs' },
  { id: 'front-squats', name: 'Front Squats', category: 'With Equipment', targetMuscle: 'Legs', difficulty: 'Advanced', imageUrl: 'https://picsum.photos/seed/frontsquats/400/300', videoUrl: 'https://www.youtube.com/embed/v-mQM_S_Zbc' },
  { id: 'romanian-deadlifts', name: 'Romanian Deadlifts (RDLs)', category: 'With Equipment', targetMuscle: 'Legs', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/rdl/400/300', videoUrl: 'https://www.youtube.com/embed/JCXUYuzwVgQ' },
  { id: 'conventional-deadlifts', name: 'Conventional Deadlifts', category: 'With Equipment', targetMuscle: 'Legs', difficulty: 'Advanced', imageUrl: 'https://picsum.photos/seed/deadlifts/400/300', videoUrl: 'https://www.youtube.com/embed/ytGaGIn3SjE' },
  { id: 'seated-hamstring-curls', name: 'Seated Hamstring Curls', category: 'With Equipment', targetMuscle: 'Legs', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/hamcurls/400/300', videoUrl: 'https://www.youtube.com/embed/0079_Z5_Z_8' },
  { id: 'lying-leg-curls', name: 'Lying Leg Curls', category: 'With Equipment', targetMuscle: 'Legs', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/lyingcurls/400/300', videoUrl: 'https://www.youtube.com/embed/1Tq3QdYUuHs' },
  { id: 'dumbbell-goblet-squats', name: 'Dumbbell Goblet Squats', category: 'With Equipment', targetMuscle: 'Legs', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/gobletsquats/400/300', videoUrl: 'https://www.youtube.com/embed/MeIiIdhvXT4' },
  { id: 'bulgarian-split-squats', name: 'Bulgarian Split Squats', category: 'With Equipment', targetMuscle: 'Legs', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/bulgarian/400/300', videoUrl: 'https://www.youtube.com/embed/2C-uNgKwPLE' },
  { id: 'barbell-hip-thrusts', name: 'Barbell Hip Thrusts', category: 'With Equipment', targetMuscle: 'Legs', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/hipthrusts/400/300', videoUrl: 'https://www.youtube.com/embed/LM8LGne7S2M' },
  { id: 'seated-dumbbell-overhead-press', name: 'Seated Dumbbell Overhead Press', category: 'With Equipment', targetMuscle: 'Shoulders', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/dbpress/400/300', videoUrl: 'https://www.youtube.com/embed/qEwKSUug9AY' },
  { id: 'standing-barbell-overhead-press', name: 'Standing Barbell Overhead Press', category: 'With Equipment', targetMuscle: 'Shoulders', difficulty: 'Advanced', imageUrl: 'https://picsum.photos/seed/bbpress/400/300', videoUrl: 'https://www.youtube.com/embed/2yjwxtZ46rg' },
  { id: 'dumbbell-lateral-raises', name: 'Dumbbell Lateral Raises', category: 'With Equipment', targetMuscle: 'Shoulders', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/latraises/400/300', videoUrl: 'https://www.youtube.com/embed/3VcKaXpzqRo' },
  { id: 'cable-lateral-raises', name: 'Cable Lateral Raises', category: 'With Equipment', targetMuscle: 'Shoulders', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/cablelat/400/300', videoUrl: 'https://www.youtube.com/embed/PPrzBWZDOhA' },
  { id: 'dumbbell-front-raises', name: 'Dumbbell Front Raises', category: 'With Equipment', targetMuscle: 'Shoulders', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/frontraises/400/300', videoUrl: 'https://www.youtube.com/embed/hRJ6EB_p-28' },
  { id: 'reverse-pec-deck', name: 'Reverse Pec Deck', category: 'With Equipment', targetMuscle: 'Shoulders', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/revpecdeck/400/300', videoUrl: 'https://www.youtube.com/embed/5Y-9v_9mO_c' },
  { id: 'arnold-press', name: 'Arnold Press', category: 'With Equipment', targetMuscle: 'Shoulders', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/arnold/400/300', videoUrl: 'https://www.youtube.com/embed/6Z15_Wdxm_k' },
  { id: 'upright-rows', name: 'Upright Rows', category: 'With Equipment', targetMuscle: 'Shoulders', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/uprightrows/400/300', videoUrl: 'https://www.youtube.com/embed/amCU-ziHITM' },
  { id: 'dumbbell-bicep-curls', name: 'Dumbbell Bicep Curls', category: 'With Equipment', targetMuscle: 'Arms', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/dbcurls/400/300', videoUrl: 'https://www.youtube.com/embed/ykJmrZ5v0Oo' },
  { id: 'barbell-bicep-curls', name: 'Barbell Bicep Curls', category: 'With Equipment', targetMuscle: 'Arms', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/bbcurls/400/300', videoUrl: 'https://www.youtube.com/embed/i1YgFZB6alI' },
  { id: 'preacher-curls', name: 'Preacher Curls', category: 'With Equipment', targetMuscle: 'Arms', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/preacher/400/300', videoUrl: 'https://www.youtube.com/embed/fIWP-E_V2Xk' },
  { id: 'tricep-cable-pushdowns', name: 'Tricep Cable Pushdowns', category: 'With Equipment', targetMuscle: 'Arms', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/pushdowns/400/300', videoUrl: 'https://www.youtube.com/embed/2-LAMcpzHLU' },
  { id: 'overhead-dumbbell-tricep-extension', name: 'Overhead Dumbbell Tricep Extension', category: 'With Equipment', targetMuscle: 'Arms', difficulty: 'Intermediate', imageUrl: 'https://picsum.photos/seed/tricepext/400/300', videoUrl: 'https://www.youtube.com/embed/X-iV-S9EPVw' },
  { id: 'cable-bicep-curls', name: 'Cable Bicep Curls', category: 'With Equipment', targetMuscle: 'Arms', difficulty: 'Beginner', imageUrl: 'https://picsum.photos/seed/cablecurls/400/300', videoUrl: 'https://www.youtube.com/embed/AsAVbB72ID0' },
];

const CATEGORIES = Array.from(new Set(EXERCISES.map(ex => ex.category)));

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0F1115] text-white p-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-gray-400 mb-6 max-w-md">
            {this.state.error?.message.startsWith('{') 
              ? "A database error occurred. Please check your connection or permissions."
              : this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[var(--accent-cyan)] text-black font-bold rounded-xl"
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Footer = ({ isDark }: { isDark: boolean }) => (
  <footer className={`mt-20 py-12 border-t ${isDark ? 'border-white/10 bg-[#0A0C10]' : 'border-black/10 bg-gray-50'}`}>
    <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)] to-blue-600 flex items-center justify-center">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <span className={`text-xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>FitForm AI</span>
      </div>
      
      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
        <button className={`text-sm font-bold uppercase tracking-widest transition-colors ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-600 hover:text-black'}`}>About Us</button>
        <button className={`text-sm font-bold uppercase tracking-widest transition-colors ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-600 hover:text-black'}`}>Privacy Policy</button>
        <button className={`text-sm font-bold uppercase tracking-widest transition-colors ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-600 hover:text-black'}`}>Terms of Service</button>
        <button className={`text-sm font-bold uppercase tracking-widest transition-colors ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-600 hover:text-black'}`}>Contact Us</button>
      </div>

      <div className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
        © {new Date().getFullYear()} FitForm AI. All rights reserved.
      </div>
    </div>
  </footer>
);

export default function App() {
  return (
    <ErrorBoundary>
      <FitFormApp />
    </ErrorBoundary>
  );
}

function FitFormApp() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('dark');
  const [view, setView] = useState<'dashboard' | 'selection' | 'workout' | 'nutrition' | 'recovery' | 'analytics' | 'rewards' | 'healthcare' | 'report' | 'outdoor' | 'community' | 'subscription' | 'live'>('dashboard');
  const [equipmentFilter, setEquipmentFilter] = useState<'All' | 'No Equipment' | 'With Equipment'>('All');
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<'All' | 'Chest' | 'Back' | 'Legs' | 'Core' | 'Shoulders' | 'Arms' | 'Full Body'>('All');
  const [visibleExercisesCount, setVisibleExercisesCount] = useState(12);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState(EXERCISES[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [poseDetected, setPoseDetected] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [riskLevel, setRiskLevel] = useState<'Low' | 'Medium' | 'High' | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<string | null>(null);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<number | null>(null);
  const [currentPoseResults, setCurrentPoseResults] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [prevRiskLevel, setPrevRiskLevel] = useState<'Low' | 'Medium' | 'High' | null>(null);
  const [showCorrectionSuccess, setShowCorrectionSuccess] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [lastSession, setLastSession] = useState<WorkoutSession | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [analysisInterval, setAnalysisInterval] = useState(3000);
  const [voiceSpeed, setVoiceSpeed] = useState(1);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionAccuracies, setSessionAccuracies] = useState<number[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [aiAnalyticsSummary, setAiAnalyticsSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  // Dietary Page States
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerMode, setScannerMode] = useState<'camera' | 'upload' | 'result'>('upload');
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment');
  const [scanResult, setScanResult] = useState<{ name: string; calories: number; protein: number; carbs: number; fat: number; weight?: string; confidence: number } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const nutritionWebcamRef = useRef<Webcam>(null);

  const analyzeFoodImage = async (base64Data: string) => {
    setIsScanning(true);
    setScannerMode('result');
    setScanError(null);
    try {
      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data })
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze food');
      }

      const result = await response.json();
      setScanResult(result);
    } catch (err) {
      console.error("Food analysis error:", err);
      setScanError("Failed to analyze food. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const captureFoodPhoto = () => {
    if (nutritionWebcamRef.current) {
      const imageSrc = nutritionWebcamRef.current.getScreenshot();
      if (imageSrc) {
        const base64Data = imageSrc.split(',')[1];
        analyzeFoodImage(base64Data);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        analyzeFoodImage(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateAngle = (p1: any, p2: any, p3: any) => {
    const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [mealCategoryFilter, setMealCategoryFilter] = useState<'All' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('All');
  const [manualLogOpen, setManualLogOpen] = useState(false);
  const [activeRoutine, setActiveRoutine] = useState<any>(null);
  const [routineStep, setRoutineStep] = useState(0);
  const [routineTimeLeft, setRoutineTimeLeft] = useState(0);
  const [isRoutinePaused, setIsRoutinePaused] = useState(false);
  
  // Custom Plan Feature States
  const [customPlans, setCustomPlans] = useState<{id: string, name: string, exercises: any[]}[]>([]);
  const [showPlanCreator, setShowPlanCreator] = useState(false);
  const [planDraftName, setPlanDraftName] = useState("");
  const [planDraftExercises, setPlanDraftExercises] = useState<any[]>([]);
  const [activeCustomPlan, setActiveCustomPlan] = useState<any>(null);
  const [customPlanStep, setCustomPlanStep] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeRoutine && !isRoutinePaused && routineTimeLeft > 0) {
      interval = setInterval(() => {
        setRoutineTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (activeRoutine && routineTimeLeft === 0) {
      if (routineStep < activeRoutine.exercises.length - 1) {
        setRoutineStep(prev => prev + 1);
        setRoutineTimeLeft(activeRoutine.exercises[routineStep + 1].duration);
      } else {
        setActiveRoutine(null);
        // We can just end it silently or show a toast, but for now just clear it
      }
    }
    return () => clearInterval(interval);
  }, [activeRoutine, isRoutinePaused, routineTimeLeft, routineStep]);
  const [manualFood, setManualFood] = useState('');
  const [manualWeight, setManualWeight] = useState<number>(100);
  const [manualMacros, setManualMacros] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });

  useEffect(() => {
    const food = COMMON_FOODS.find(f => f.name === manualFood);
    if (food) {
      const multiplier = manualWeight / 100;
      setManualMacros({
        calories: Math.round(food.calories * multiplier),
        protein: Math.round(food.protein * multiplier * 10) / 10,
        carbs: Math.round(food.carbs * multiplier * 10) / 10,
        fats: Math.round(food.fats * multiplier * 10) / 10,
      });
    }
  }, [manualFood, manualWeight]);
  const [rewardCategoryFilter, setRewardCategoryFilter] = useState<'All' | 'F&B' | 'Cash' | 'Service' | 'Gadget'>('All');
  
  // Expanded Settings State
  const [userAge, setUserAge] = useState(25);
  const [userWeight, setUserWeight] = useState(70);
  const [userHeight, setUserHeight] = useState(175);
  const [userGender, setUserGender] = useState<'male' | 'female' | 'other'>('male');
  const [fitnessGoal, setFitnessGoal] = useState<'lose' | 'gain' | 'maintain'>('maintain');
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [workoutReminders, setWorkoutReminders] = useState(true);
  const [mealReminders, setMealReminders] = useState(true);
  const [selectedOutdoorActivity, setSelectedOutdoorActivity] = useState<any>(null);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [isTrackingOutdoor, setIsTrackingOutdoor] = useState(false);
  const [outdoorDistance, setOutdoorDistance] = useState(0);
  const [outdoorPoints, setOutdoorPoints] = useState(0);
  const [outdoorHistory, setOutdoorHistory] = useState<any[]>([]);
  
  // Community & Social States
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [groupPosts, setGroupPosts] = useState<any[]>([]);
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invites, setInvites] = useState<any[]>([]);
  
  // Subscription States
  const [subscription, setSubscription] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // Livestream State
  const [livestreams, setLivestreams] = useState<any[]>([]);
  const [activeStream, setActiveStream] = useState<any>(null);
  const [streamChat, setStreamChat] = useState<any[]>([]);
  const [showGoLiveModal, setShowGoLiveModal] = useState(false);
  const [isLive, setIsLive] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Sync User Profile to Firestore
  useEffect(() => {
    if (user && isAuthReady) {
      const userRef = doc(db, 'users', user.uid);
      
      // Initial fetch and real-time listener for points
      const unsubscribe = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          setUserPoints(snap.data().points || 0);
        } else {
          setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            points: 0,
            role: 'user',
            createdAt: Timestamp.now()
          }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

      return () => unsubscribe();
    }
  }, [user, isAuthReady]);

  // Real-time Workout History
  useEffect(() => {
    if (user && isAuthReady) {
      const q = query(
        collection(db, 'users', user.uid, 'workouts'),
        orderBy('timestamp', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const history = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: (doc.data().timestamp as Timestamp).toDate().toISOString()
        })) as WorkoutSession[];
        setWorkoutHistory(history);
      }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/workouts`));
      return () => unsubscribe();
    }
  }, [user, isAuthReady]);

  // Real-time Outdoor History
  useEffect(() => {
    if (user && isAuthReady) {
      const q = query(
        collection(db, 'users', user.uid, 'outdoor_activities'),
        orderBy('timestamp', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const history = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: (doc.data().timestamp as Timestamp).toDate().toISOString()
        }));
        setOutdoorHistory(history);
      }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/outdoor_activities`));
      return () => unsubscribe();
    }
  }, [user, isAuthReady]);

  // Real-time Meals
  useEffect(() => {
    if (user && isAuthReady) {
      const q = query(
        collection(db, 'users', user.uid, 'meals'),
        orderBy('timestamp', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const mealData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: (doc.data().timestamp as Timestamp).toDate().toISOString()
        }));
        setMeals(mealData);
      }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/meals`));
      return () => unsubscribe();
    }
  }, [user, isAuthReady]);

  // Real-time Bookings
  useEffect(() => {
    if (user && isAuthReady) {
      const q = query(
        collection(db, 'users', user.uid, 'bookings'),
        orderBy('appointmentTime', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const bookingData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: (doc.data().appointmentTime as Timestamp).toDate().toISOString()
        }));
        setBookings(bookingData);
      }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/bookings`));
      return () => unsubscribe();
    }
  }, [user, isAuthReady]);

  // Real-time Groups Listener
  useEffect(() => {
    if (user && isAuthReady) {
      const q = query(collection(db, 'groups'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snap) => {
        const groupsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGroups(groupsList);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'groups'));
      return () => unsubscribe();
    }
  }, [user, isAuthReady]);

  // Real-time Selected Group Posts Listener
  useEffect(() => {
    if (user && isAuthReady && selectedGroup) {
      const q = query(
        collection(db, 'groups', selectedGroup.id, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const unsubscribe = onSnapshot(q, (snap) => {
        const posts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGroupPosts(posts);
      }, (err) => handleFirestoreError(err, OperationType.LIST, `groups/${selectedGroup.id}/posts`));
      return () => unsubscribe();
    }
  }, [user, isAuthReady, selectedGroup]);

  // Real-time Invites Listener
  useEffect(() => {
    if (user && isAuthReady) {
      const q = query(
        collection(db, 'invites'),
        where('inviterId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snap) => {
        const invitesList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInvites(invitesList);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'invites'));
      return () => unsubscribe();
    }
  }, [user, isAuthReady]);

  // Real-time Subscription Listener
  useEffect(() => {
    if (user && isAuthReady) {
      const q = query(
        collection(db, 'users', user.uid, 'subscriptions'),
        where('status', '==', 'active'),
        limit(1)
      );
      const unsubscribe = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          setSubscription({ id: snap.docs[0].id, ...snap.docs[0].data() });
        } else {
          setSubscription(null);
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}/subscriptions`));
      return () => unsubscribe();
    }
  }, [user, isAuthReady]);

  // Real-time Livestreams Listener
  useEffect(() => {
    if (user && isAuthReady) {
      const q = query(collection(db, 'livestreams'), where('isActive', '==', true), orderBy('startedAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snap) => {
        setLivestreams(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'livestreams'));
      return () => unsubscribe();
    }
  }, [user, isAuthReady]);

  // Real-time Active Stream Chat Listener
  useEffect(() => {
    if (user && isAuthReady && activeStream) {
      const q = query(
        collection(db, 'livestreams', activeStream.id, 'chat'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      const unsubscribe = onSnapshot(q, (snap) => {
        setStreamChat(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse());
      }, (err) => handleFirestoreError(err, OperationType.LIST, `livestreams/${activeStream.id}/chat`));
      return () => unsubscribe();
    } else {
      setStreamChat([]);
    }
  }, [user, isAuthReady, activeStream]);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    }
  };

  const logout = () => auth.signOut();

  const generateAnalyticsSummary = async () => {
    if (!user) return;
    setIsGeneratingSummary(true);
    try {
      const workoutCount = workoutHistory.length;
      const avgAcc = workoutHistory.reduce((acc, curr) => acc + curr.avgAccuracy, 0) / (workoutCount || 1);
      const totalCals = meals.reduce((acc, curr) => acc + (curr.calories || 0), 0);

      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutCount,
          avgAcc,
          totalCals,
          language
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }
      
      const data = await response.json();
      setAiAnalyticsSummary(data.summary);
    } catch (err) {
      console.error("Summary generation error:", err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<Pose | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocalAnalysisRef = useRef<number>(0);

  const t = TRANSLATIONS[language];

  const featuresList = [
    { id: 'selection', label: t.workout || 'Workout', icon: Scan, bgIcon: Dumbbell, color: 'text-blue-500', bg: 'bg-blue-500/10', description: 'Real-time form correction for fundamental exercises and complex gym routines.', buttonText: 'Start Training', colSpan: 2 },
    { id: 'outdoor', label: t.outdoor || 'Outdoor', icon: Bike, bgIcon: Mountain, color: 'text-emerald-500', bg: 'bg-emerald-500/10', description: 'Climbing and cycling routes with Google Maps integration. Earn points for every kilometer.', buttonText: 'Explore Routes', colSpan: 2 },
    { id: 'nutrition', label: t.dietary || 'Dietary', icon: Utensils, color: 'text-purple-500', bg: 'bg-purple-500/10', description: 'Track calories and discover healthy recipes.', buttonText: 'Manage Diet', colSpan: 1 },
    { id: 'recovery', label: t.recovery || 'Recovery', icon: Heart, color: 'text-green-500', bg: 'bg-green-500/10', description: 'Guided stretching and injury prevention routines.', buttonText: 'Start Recovery', colSpan: 1 },
    { id: 'community', label: t.community || 'Community', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10', description: 'Connect with fitness enthusiasts and share your progress.', buttonText: 'Join Community', colSpan: 1 },
    { id: 'analytics', label: t.records || 'Records', icon: FileText, color: 'text-yellow-500', bg: 'bg-yellow-500/10', description: 'Deep dive into your performance metrics.', buttonText: 'View Reports', colSpan: 1 },
    { id: 'live', label: t.live || 'Live', icon: Camera, color: 'text-red-500', bg: 'bg-red-500/10', description: 'Join live workout sessions and interact with trainers.', buttonText: 'Join Live', colSpan: 1 },
    { id: 'healthcare', label: t.nearbyMe || 'Nearby Me', icon: MapPin, color: 'text-teal-500', bg: 'bg-teal-500/10', description: 'Book physiotherapy and find medical partners.', buttonText: 'Get Support', colSpan: 1 },
    { id: 'rewards', label: t.myPoints || 'MyPoints', icon: Zap, color: 'text-pink-500', bg: 'bg-pink-500/10', description: 'Redeem points for vouchers and premium access.', buttonText: 'Explore Shop', colSpan: 1 },
    { id: 'subscription', label: t.premium || 'Premium', icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/10', description: 'Unlock advanced features and personalized plans.', buttonText: 'Upgrade Now', colSpan: 1 },
  ];

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'zh' ? 'zh-CN' : language === 'ms' ? 'ms-MY' : 'en-US';
    utterance.rate = voiceSpeed;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled, language, voiceSpeed]);

  const analyzeFrame = useCallback(async () => {
    if (!webcamRef.current || view !== 'workout') return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    // Calculate angles if pose results are available
    let anglesInfo = "";
    if (currentPoseResults?.poseLandmarks) {
      const lm = currentPoseResults.poseLandmarks;
      // Example: Elbow angle (Shoulder, Elbow, Wrist)
      const leftElbowAngle = calculateAngle(lm[11], lm[13], lm[15]);
      const rightElbowAngle = calculateAngle(lm[12], lm[14], lm[16]);
      // Example: Knee angle (Hip, Knee, Ankle)
      const leftKneeAngle = calculateAngle(lm[23], lm[25], lm[27]);
      const rightKneeAngle = calculateAngle(lm[24], lm[26], lm[28]);
      
      anglesInfo = `
      Detected Biomechanical Angles:
      - Left Elbow: ${leftElbowAngle.toFixed(1)}°
      - Right Elbow: ${rightElbowAngle.toFixed(1)}°
      - Left Knee: ${leftKneeAngle.toFixed(1)}°
      - Right Knee: ${rightKneeAngle.toFixed(1)}°
      `;
    }

    try {
      if (!webcamRef.current || !webcamRef.current.video || webcamRef.current.video.readyState !== 4 || !selectedExercise) {
        console.warn("Webcam not ready or no exercise selected");
        return;
      }
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;
      
      const base64Data = imageSrc.split(',')[1];
      
      const response = await fetch('/api/analyze-pose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          exerciseName: selectedExercise.name,
          anglesInfo: anglesInfo,
          language: language
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Check for posture correction
      if ((prevRiskLevel === 'High' || prevRiskLevel === 'Medium') && result.riskLevel === 'Low') {
        setShowCorrectionSuccess(true);
        speak(t.postureCorrected);
        setTimeout(() => setShowCorrectionSuccess(false), 3000);
      } else if (result.instructions && result.riskLevel !== 'Low') {
        speak(result.instructions);
      } else if (result.warning) {
        speak(result.warning);
      }

      setPrevRiskLevel(result.riskLevel);
      // We do not override local feedback directly unless risk is serious,
      // to avoid jitter between local heuristics and AI. But we will update it if risk is Medium/High.
      if (result.riskLevel === 'High' || result.riskLevel === 'Medium') {
        setFeedback(`AI: ${result.feedback}`);
        setRiskLevel(result.riskLevel);
        setWarning(result.warning);
        setInstructions(result.instructions);
      }
      
      setLastAnalysisTime(Date.now());
      setError(null);
    } catch (err) {
      console.warn("AI Analysis snapshot failed/ignored:", err);
      // We do not set error anymore for seamless UX, relying on the fast local loop!
    }
  }, [selectedExercise, view, language, t]);

  useEffect(() => {
    if (isAnalyzing && !isPaused && view === 'workout') {
      analysisIntervalRef.current = setInterval(analyzeFrame, analysisInterval);
    } else {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    }
    return () => {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    };
  }, [isAnalyzing, isPaused, analyzeFrame, view, analysisInterval]);

  const toggleAnalysis = () => {
    if (isAnalyzing) {
      // Stopping analysis - save session
      if (sessionStartTime && selectedExercise) {
        const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
        const avgAcc = sessionAccuracies.length > 0 
          ? Math.round(sessionAccuracies.reduce((a, b) => a + b, 0) / sessionAccuracies.length)
          : 0;
        
        if (duration > 5 && user) { // Only save sessions longer than 5 seconds
          const workoutData = {
            userId: user.uid,
            exerciseId: selectedExercise.id,
            exerciseName: selectedExercise.name,
            duration,
            accuracyScore: avgAcc,
            timestamp: Timestamp.now()
          };
          
          addDoc(collection(db, 'users', user.uid, 'workouts'), workoutData)
            .catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/workouts`));
          
          // Update points (10-20 points randomly + consistency boost)
          const userRef = doc(db, 'users', user.uid);
          getDoc(userRef).then(snap => {
            if (snap.exists()) {
              const currentPoints = snap.data().points || 0;
              const currentStreak = snap.data().streak || 0;
              
              // 10-20 points randomly
              let pointsToAward = Math.floor(Math.random() * 11) + 10;
              
              // Consistency boost: +5 points if streak > 5
              if (currentStreak > 5) {
                pointsToAward += 5;
              }
              
              setDoc(userRef, { points: currentPoints + pointsToAward }, { merge: true })
                .catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`));
              
              // Show a toast or feedback (simulated)
              console.log(`Awarded ${pointsToAward} points!`);
            }
          });
        }
      }
      setIsAnalyzing(false);
      setSessionStartTime(null);
      setSessionAccuracies([]);
    } else {
      setIsAnalyzing(true);
      setSessionStartTime(Date.now());
      setSessionAccuracies([]);
      setFeedback(t.startingAnalysis);
      setAccuracy(null);
      setRiskLevel(null);
      setWarning(null);
      setInstructions(null);
    }
  };

  useEffect(() => {
    if (isAnalyzing && accuracy !== null) {
      setSessionAccuracies(prev => [...prev, accuracy]);
    }
  }, [isAnalyzing, accuracy]);

  const handleBack = () => {
    setIsAnalyzing(false);
    setView('selection');
    setFeedback(null);
    setAccuracy(null);
    setRiskLevel(null);
    setWarning(null);
    setInstructions(null);
    setActiveCustomPlan(null);
  };

  const getRiskColor = (level: string | null) => {
    switch (level) {
      case 'High': return 'text-red-500';
      case 'Medium': return 'text-orange-500';
      case 'Low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const isDark = theme === 'dark';

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDark]);

  const onResultsRef = useRef<(results: Results) => void>(() => {});

  useEffect(() => {
    onResultsRef.current = (results) => {
      setCurrentPoseResults(results);
      setPoseDetected(!!results.poseLandmarks);
      if (canvasRef.current && results.poseLandmarks) {
        const canvasCtx = canvasRef.current.getContext('2d');
        if (canvasCtx) {
          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          // Draw landmarks and connectors
          drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00E5FF', lineWidth: 2 });
          drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#FFFFFF', lineWidth: 1, radius: 2 });

          // Draw framing box around relevant body parts
          if (isAnalyzing && !isPaused) {
            const landmarks = results.poseLandmarks;
            let minX = 1, minY = 1, maxX = 0, maxY = 0;
            
            // Determine relevant landmarks based on exercise
            const relevantIndices = getRelevantLandmarks(selectedExercise.id);
            relevantIndices.forEach(idx => {
              const lm = landmarks[idx];
              if (lm.visibility && lm.visibility > 0.5) {
                minX = Math.min(minX, lm.x);
                minY = Math.min(minY, lm.y);
                maxX = Math.max(maxX, lm.x);
                maxY = Math.max(maxY, lm.y);
              }
            });

            if (maxX > minX && maxY > minY) {
              const padding = 0.05;
              const boxX = Math.max(0, minX - padding) * canvasRef.current.width;
              const boxY = Math.max(0, minY - padding) * canvasRef.current.height;
              const boxW = Math.min(1, maxX + padding) * canvasRef.current.width - boxX;
              const boxH = Math.min(1, maxY + padding) * canvasRef.current.height - boxY;

              // Color based on accuracy/risk
              let color = '#22C55E'; // Green
              if (riskLevel === 'High') color = '#EF4444'; // Red
              else if (riskLevel === 'Medium') color = '#F97316'; // Orange
              else if (accuracy !== null && accuracy < 60) color = '#EF4444';
              else if (accuracy !== null && accuracy < 85) color = '#F97316';

              canvasCtx.strokeStyle = color;
              canvasCtx.lineWidth = 4;
              canvasCtx.strokeRect(boxX, boxY, boxW, boxH);
              
              // Add label
              canvasCtx.fillStyle = color;
              canvasCtx.font = 'bold 14px Inter';
              canvasCtx.fillText(selectedExercise.name, boxX, boxY - 10);
            }

            // Local real-time analysis (every 500ms)
            if (Date.now() - lastLocalAnalysisRef.current > 500 && landmarks[11] && landmarks[12] && landmarks[23] && landmarks[24]) {
              lastLocalAnalysisRef.current = Date.now();
              const leftElbowAngle = calculateAngle(landmarks[11], landmarks[13], landmarks[15]);
              const rightElbowAngle = calculateAngle(landmarks[12], landmarks[14], landmarks[16]);
              const leftKneeAngle = calculateAngle(landmarks[23], landmarks[25], landmarks[27]);
              const rightKneeAngle = calculateAngle(landmarks[24], landmarks[26], landmarks[28]);
              
              let newAcc = 100;
              let newRisk = 'Low' as 'Low'|'Medium'|'High';
              let newFeedback = 'Good posture detected.';
              let newExplanation = 'Your form looks excellent.';

              const exerciseName = selectedExercise.name.toLowerCase();
              
              if (exerciseName.includes('push')) {
                if (leftElbowAngle > 160 && rightElbowAngle > 160) {
                  newFeedback = "Ready. Lower yourself now.";
                  newExplanation = "Start your descent slowly while keeping your core tight.";
                  newAcc = 90;
                } else if (leftElbowAngle > 110 || rightElbowAngle > 110) {
                  newFeedback = "Go lower! Break parallel.";
                  newExplanation = `Your elbows are currently at ${leftElbowAngle.toFixed(0)}°. You need to reach 90° for a full range of motion. Accuracy dropped to 65%.`;
                  newAcc = 65;
                } else {
                  newFeedback = "Good depth! Push up.";
                  newExplanation = "Perfect depth achieved. Push back up explosively.";
                  newAcc = 95;
                }
              } else if (exerciseName.includes('squat')) {
                if (leftKneeAngle > 160 && rightKneeAngle > 160) {
                  newFeedback = "Stand tall, get ready.";
                  newExplanation = "Keep your chest up and core engaged.";
                  newAcc = 90;
                } else if (leftKneeAngle > 110 || rightKneeAngle > 110) {
                  newFeedback = "Squat deeper, bend your knees.";
                  newExplanation = `Knee angle is ${leftKneeAngle.toFixed(0)}°. Squat until thighs are parallel to the floor for maximum engagement. Score: 70%.`;
                  newAcc = 70;
                } else {
                  newFeedback = "Great squat depth!";
                  newExplanation = "Thighs are parallel. Drive through your heels to stand up.";
                  newAcc = 98;
                }
              } else if (exerciseName.includes('lunge')) {
                 if (leftKneeAngle < 100 || rightKneeAngle < 100) {
                   newFeedback = "Good lunge depth.";
                   newExplanation = "Knees are nicely bent at 90 degrees. Maintain your balance.";
                   newAcc = 95;
                 } else {
                   newFeedback = "Bend your knees to 90 degrees.";
                   newExplanation = `You are not descending low enough (Knee angle: ${leftKneeAngle.toFixed(0)}°). Drop your back knee closer to the floor. Accuracy: 80%.`;
                   newAcc = 80;
                 }
              } else {
                 // Generic fallback
                 if (leftElbowAngle < 150 || rightElbowAngle < 150 || leftKneeAngle < 150 || rightKneeAngle < 150) {
                   newFeedback = "Active movement detected. Keep going!";
                   newExplanation = "Maintaining constant tension throughout the workout.";
                   newAcc = 90;
                 } else {
                   newFeedback = "Ready position. Start when you are ready.";
                   newExplanation = "Ensure proper breathing before you begin the next rep.";
                   newAcc = 100;
                 }
              }
              
              // Only override feedback if it hasn't been set by AI recently, or just constantly update the local fast loop
              // Let's just update perfectly real-time for immediate visual feedback.
              setAccuracy(newAcc);
              setFeedback(newFeedback);
              setInstructions(newExplanation);
              if (newRisk !== 'Low') setRiskLevel(newRisk);
            }
          }
          canvasCtx.restore();
        }
      }
    };
  }, [isAnalyzing, isPaused, selectedExercise, accuracy, riskLevel]);

  // MediaPipe Pose Setup
  useEffect(() => {
    const pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults((results) => {
      onResultsRef.current(results);
    });

    poseRef.current = pose;

    return () => {
      pose.close();
    };
  }, []);

  const getRelevantLandmarks = (id: string) => {
    // MediaPipe Pose landmarks: 
    // 11, 12: shoulders
    // 23, 24: hips
    // 25, 26: knees
    // 27, 28: ankles
    // 13, 14: elbows
    // 15, 16: wrists
    switch (id) {
      case 'pushups': return [11, 12, 13, 14, 15, 16, 23, 24];
      case 'squats': return [23, 24, 25, 26, 27, 28];
      case 'plank': return [11, 12, 23, 24, 25, 26];
      case 'lunges': return [23, 24, 25, 26, 27, 28];
      case 'bicep-curls': return [11, 12, 13, 14, 15, 16];
      case 'shoulder-press': return [11, 12, 13, 14, 15, 16];
      case 'deadlifts': return [11, 12, 23, 24, 25, 26, 27, 28];
      case 'mountain-climbers': return [11, 12, 23, 24, 25, 26, 27, 28];
      default: return [11, 12, 23, 24, 25, 26];
    }
  };

  // Frame processing loop for MediaPipe
  useEffect(() => {
    let animationFrameId: number;
    const processFrame = async () => {
      if (webcamRef.current && webcamRef.current.video && poseRef.current) {
        if (webcamRef.current.video.readyState === 4) {
          await poseRef.current.send({ image: webcamRef.current.video });
        }
      }
      animationFrameId = requestAnimationFrame(processFrame);
    };
    processFrame();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const generatePDF = (session: WorkoutSession) => {
    const doc = new jsPDF();
    const primaryColor = [0, 229, 255]; // Cyan
    
    // Header
    doc.setFillColor(15, 17, 21);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("FitForm AI - Workout Report", 20, 25);
    
    // Content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text(`Exercise: ${t.exercises[session.exerciseId as keyof typeof t.exercises]?.name || EXERCISES.find(e => e.id === session.exerciseId)?.name || session.exerciseId}`, 20, 60);
    doc.setFontSize(12);
    doc.text(`Date: ${new Date(session.date).toLocaleString()}`, 20, 70);
    doc.text(`Duration: ${Math.floor(session.duration / 60)}m ${session.duration % 60}s`, 20, 80);
    doc.text(`Average Accuracy: ${session.avgAccuracy}%`, 20, 90);
    
    // Analysis
    doc.setFontSize(14);
    doc.text("Session Analysis", 20, 110);
    doc.setFontSize(10);
    const splitFeedback = doc.splitTextToSize(`Final Feedback: ${feedback || 'N/A'}`, 170);
    doc.text(splitFeedback, 20, 120);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Generated by FitForm AI - Your Personal AI Fitness Coach", 105, 280, { align: 'center' });
    
    doc.save(`FitForm_Report_${session.exerciseId}_${new Date().getTime()}.pdf`);
  };

  const handleFinish = () => {
    if (isAnalyzing && sessionStartTime && selectedExercise && user) {
      const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
      const avgAcc = sessionAccuracies.length > 0 
        ? Math.round(sessionAccuracies.reduce((a, b) => a + b, 0) / sessionAccuracies.length)
        : 0;
      
      const workoutData = {
        userId: user.uid,
        exerciseId: selectedExercise.id,
        exerciseName: selectedExercise.name,
        duration,
        accuracyScore: avgAcc,
        timestamp: Timestamp.now()
      };

      addDoc(collection(db, 'users', user.uid, 'workouts'), workoutData)
        .then((docRef) => {
          const newSession: WorkoutSession = {
            id: docRef.id,
            exerciseId: selectedExercise.id,
            exerciseName: selectedExercise.name,
            date: new Date().toISOString(),
            duration,
            avgAccuracy: avgAcc,
            category: selectedExercise.category
          };
          setLastSession(newSession);
          setReportData(newSession);
          
          if (activeCustomPlan) {
            if (customPlanStep < activeCustomPlan.exercises.length - 1) {
              const nextStep = customPlanStep + 1;
              setCustomPlanStep(nextStep);
              const nextExName = activeCustomPlan.exercises[nextStep].name;
              setSelectedExercise(EXERCISES.find(e => e.name === nextExName) || EXERCISES[0]);
              setSessionStartTime(Date.now());
              setSessionAccuracies([]);
              setFeedback(t.startingAnalysis);
              setInstructions(null);
            } else {
              setActiveCustomPlan(null);
              setShowReport(true);
            }
          } else {
            setShowReport(true);
          }
        })
        .catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/workouts`));
      
      // Update points
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then(snap => {
        if (snap.exists()) {
          const currentPoints = snap.data().points || 0;
          setDoc(userRef, { points: currentPoints + Math.floor(duration / 10) }, { merge: true })
            .catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`));
        }
      });
      
      // Confetti effect
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00E5FF', '#FFFFFF', '#3B82F6']
      });
    }
    setIsAnalyzing(false);
    setIsPaused(false);
    setSessionStartTime(null);
    setSessionAccuracies([]);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("FitForm AI - Health Records", 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
    
    doc.text("Workout Summary:", 20, 50);
    doc.text(`Total Workouts: ${workoutHistory.length}`, 20, 60);
    doc.text(`Total Time: ${Math.round(workoutHistory.reduce((acc, curr) => acc + curr.duration, 0) / 60)} min`, 20, 70);
    
    doc.text("Nutrition Summary:", 20, 90);
    doc.text(`Total Calories Consumed: ${meals.reduce((acc, curr) => acc + (curr.calories || 0), 0)} kcal`, 20, 100);
    
    doc.save("FitForm_Health_Records.pdf");
  };

  const handleRestart = () => {
    setIsAnalyzing(false);
    setIsPaused(false);
    setSessionStartTime(null);
    setSessionAccuracies([]);
    setFeedback(null);
    setAccuracy(null);
    setRiskLevel(null);
    setWarning(null);
    setInstructions(null);
    setActiveCustomPlan(null);
    // Go back to exercise selection
    setView('selection');
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#0F1115] text-white' : 'bg-[#F7F8FA] text-gray-900'} selection:bg-[var(--accent-cyan)]/30 relative`}>
      {/* Ambient Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-drift ${isDark ? 'bg-blue-600/30' : 'bg-blue-300/40'}`} style={{ animationDelay: '0s' }} />
        <div className={`absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-drift ${isDark ? 'bg-purple-600/30' : 'bg-purple-300/40'}`} style={{ animationDelay: '-5s' }} />
        <div className={`absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] rounded-full mix-blend-screen filter blur-[150px] opacity-30 animate-drift ${isDark ? 'bg-cyan-600/30' : 'bg-cyan-300/40'}`} style={{ animationDelay: '-10s' }} />
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfile(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-[2.5rem] border shadow-2xl flex flex-col ${isDark ? 'bg-[#16191F] border-white/10' : 'bg-white border-black/10'}`}
            >
              {/* Modal Header */}
              <div className={`p-8 border-b flex justify-between items-center ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-[var(--accent-cyan)] to-blue-500 rounded-2xl shadow-lg">
                    <UserIcon className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.profile}</h2>
                    <p className={`text-xs font-medium uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{user?.displayName || user?.email || t.stats}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowProfile(false)}
                  className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-black/5 text-gray-400'}`}
                >
                  <Square className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className={`p-1- overflow-y-auto p-8 custom-scrollbar space-y-8`}>
                {user ? (
                  <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <Activity className="w-4 h-4 text-[var(--accent-cyan)]" />
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t.totalWorkouts}</span>
                        </div>
                        <div className={`text-3xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{workoutHistory.length}</div>
                      </div>
                      <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <Zap className="w-4 h-4 text-yellow-400" />
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Points</span>
                        </div>
                        <div className={`text-3xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {userPoints}
                        </div>
                      </div>
                      <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <Flame className="w-4 h-4 text-orange-400" />
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t.streak}</span>
                        </div>
                        <div className={`text-3xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {(() => {
                            const dates = Array.from(new Set(workoutHistory.map(s => new Date(s.date).toDateString())));
                            let streak = 0;
                            let current = new Date();
                            while (dates.includes(current.toDateString())) {
                              streak++;
                              current.setDate(current.getDate() - 1);
                            }
                            return streak;
                          })()} <span className="text-sm font-normal opacity-50">{t.days}</span>
                        </div>
                      </div>
                    </div>

                    {/* Daily Goal Progress */}
                    <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <Target className="w-5 h-5 text-red-400" />
                          <span className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.dailyGoal}</span>
                        </div>
                        <div className="text-xs font-bold text-gray-500">
                          {Math.floor(workoutHistory.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).reduce((a, b) => a + b.duration, 0) / 60)} / 15 {t.minutes}
                        </div>
                      </div>
                      <div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (workoutHistory.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).reduce((a, b) => a + b.duration, 0) / 900) * 100)}%` }}
                          className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                        />
                      </div>
                    </div>

                    {/* History List */}
                    <div className="space-y-4">
                      <h3 className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t.recentActivity}</h3>
                      {workoutHistory.length === 0 ? (
                        <div className={`text-center py-12 rounded-3xl border border-dashed ${isDark ? 'border-white/10 text-gray-500' : 'border-black/10 text-gray-400'}`}>
                          <Info className="w-8 h-8 mx-auto mb-3 opacity-20" />
                          <p className="text-sm">{t.noHistory}</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {workoutHistory.map(session => (
                            <div 
                              key={session.id}
                              className={`p-4 rounded-2xl border flex items-center justify-between group transition-all ${isDark ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]' : 'bg-black/[0.02] border-black/5 hover:bg-black/[0.04]'}`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isDark ? 'bg-black/40 border-white/10' : 'bg-white border-black/10'}`}>
                                  <ExerciseSymbol id={session.exerciseId} className="w-5 h-5 text-[var(--accent-cyan)]" />
                                </div>
                                <div>
                                  <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.exercises[session.exerciseId as keyof typeof t.exercises]?.name || EXERCISES.find(e => e.id === session.exerciseId)?.name || session.exerciseId}</div>
                                  <div className="text-[10px] text-gray-500 font-medium">
                                    {new Date(session.date).toLocaleDateString()} • {Math.floor(session.duration / 60)} {t.minutes} {session.duration % 60} {t.seconds}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-[var(--accent-cyan)]">{session.avgAccuracy}%</div>
                                <div className={`text-[8px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t.accuracy}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <LogIn className="w-16 h-16 text-[var(--accent-cyan)] mb-6 opacity-20" />
                    <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Sign in to track progress</h3>
                    <p className={`text-sm mb-8 max-w-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Connect your account to save workout history, earn points, and get personalized insights.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={login}
                      className="px-8 py-4 bg-[var(--accent-cyan)] text-black font-bold rounded-2xl shadow-lg flex items-center gap-3"
                    >
                      <LogIn className="w-5 h-5" />
                      Sign in with Google
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Summary Modal */}
      <AnimatePresence>
        {showSummary && lastSession && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-lg overflow-hidden rounded-[3rem] border shadow-2xl flex flex-col items-center text-center p-10 ${isDark ? 'bg-[#16191F] border-white/10' : 'bg-white border-black/10'}`}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--accent-cyan)] to-blue-500 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,229,255,0.4)]">
                <CheckCircle2 className="w-10 h-10 text-black" />
              </div>
              
              <h2 className={`text-3xl font-display font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.wellDone}</h2>
              <p className={`text-sm mb-10 max-w-[280px] mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.keepItUp}</p>
              
              <div className="grid grid-cols-2 gap-6 w-full mb-10">
                <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">{t.sessionDuration}</div>
                  <div className={`text-2xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {Math.floor(lastSession.duration / 60)}:{String(lastSession.duration % 60).padStart(2, '0')}
                  </div>
                </div>
                <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">{t.averageAccuracy}</div>
                  <div className="text-2xl font-display font-bold text-[var(--accent-cyan)]">
                    {lastSession.avgAccuracy}%
                  </div>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowSummary(false);
                  setView('selection');
                }}
                className="w-full py-5 rounded-2xl bg-white text-black font-bold uppercase tracking-widest text-sm shadow-xl hover:bg-gray-100 transition-all"
              >
                {t.finish}
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {showReport && reportData && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-2xl overflow-hidden rounded-[3rem] border shadow-2xl flex flex-col ${isDark ? 'bg-[#16191F] border-white/10' : 'bg-white border-black/10'}`}
            >
              <div className="p-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--accent-cyan)] to-blue-500 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,229,255,0.4)]">
                  <FileText className="w-10 h-10 text-black" />
                </div>
                
                <h2 className={`text-3xl font-display font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.workoutReport}</h2>
                <p className={`text-sm mb-10 max-w-[320px] mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.reportSummary}</p>
                
                <div className="grid grid-cols-2 gap-4 w-full mb-10">
                  <div className={`p-6 rounded-3xl border text-left ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{t.exercise}</div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.exercises[reportData.exerciseId as keyof typeof t.exercises]?.name || EXERCISES.find(e => e.id === reportData.exerciseId)?.name || reportData.exerciseId}</div>
                  </div>
                  <div className={`p-6 rounded-3xl border text-left ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{t.duration}</div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{Math.floor(reportData.duration / 60)}m {reportData.duration % 60}s</div>
                  </div>
                  <div className={`p-6 rounded-3xl border text-left ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{t.accuracy}</div>
                    <div className="text-lg font-bold text-[var(--accent-cyan)]">{reportData.avgAccuracy}%</div>
                  </div>
                  <div className={`p-6 rounded-3xl border text-left ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{t.date}</div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{new Date(reportData.date).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => generatePDF(reportData)}
                    className="flex-1 py-5 rounded-2xl bg-[var(--accent-cyan)] text-black font-bold uppercase tracking-widest text-sm shadow-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-3"
                  >
                    <Download className="w-5 h-5" />
                    {t.downloadPDF}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowReport(false);
                      setView('selection');
                    }}
                    className={`flex-1 py-5 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-gray-900 hover:bg-black/10'}`}
                  >
                    {t.close}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border shadow-2xl flex flex-col max-h-[90vh] ${isDark ? 'bg-[#16191F] border-white/10' : 'bg-white border-black/10'}`}
            >
              <div className={`p-8 border-b flex justify-between items-center ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl shadow-lg">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <h2 className={`text-2xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.settings}</h2>
                </div>
                <button 
                  onClick={() => setShowSettings(false)}
                  className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-black/5 text-gray-400'}`}
                >
                  <Square className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-8 space-y-10">
                  {/* Profile Section */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                      <UserIcon className="w-5 h-5 text-purple-500" />
                      <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>User Profile</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Age</label>
                        <input 
                          type="number" 
                          value={userAge} 
                          onChange={(e) => setUserAge(parseInt(e.target.value))}
                          className={`w-full px-5 py-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-black/5 text-gray-900'}`} 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Gender</label>
                        <select 
                          value={userGender} 
                          onChange={(e) => setUserGender(e.target.value as any)}
                          className={`w-full px-5 py-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-black/5 text-gray-900'}`}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Weight ({unitSystem === 'metric' ? 'kg' : 'lbs'})</label>
                        <input 
                          type="number" 
                          value={userWeight} 
                          onChange={(e) => setUserWeight(parseInt(e.target.value))}
                          className={`w-full px-5 py-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-black/5 text-gray-900'}`} 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Height ({unitSystem === 'metric' ? 'cm' : 'in'})</label>
                        <input 
                          type="number" 
                          value={userHeight} 
                          onChange={(e) => setUserHeight(parseInt(e.target.value))}
                          className={`w-full px-5 py-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-black/5 text-gray-900'}`} 
                        />
                      </div>
                    </div>
                  </section>

                  {/* Fitness Goals */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-blue-500" />
                      <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Fitness Goals</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'lose', label: 'Lose Weight' },
                        { id: 'maintain', label: 'Maintain' },
                        { id: 'gain', label: 'Gain Muscle' }
                      ].map((goal) => (
                        <button
                          key={goal.id}
                          onClick={() => setFitnessGoal(goal.id as any)}
                          className={`py-3 rounded-xl border text-xs font-bold transition-all ${fitnessGoal === goal.id ? 'bg-blue-500 border-blue-500 text-white' : (isDark ? 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10' : 'bg-black/5 border-black/5 text-gray-500 hover:bg-black/10')}`}
                        >
                          {goal.label}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* App Preferences */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Wind className="w-5 h-5 text-green-500" />
                      <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>App Preferences</h3>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Language</p>
                          <p className="text-xs text-gray-500">Select your preferred language</p>
                        </div>
                        <div className={`flex p-1 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                          {[
                            { id: 'en', label: 'EN' },
                            { id: 'zh', label: 'ZH' },
                            { id: 'ms', label: 'MS' }
                          ].map((lang) => (
                            <button 
                              key={lang.id}
                              onClick={() => setLanguage(lang.id as any)}
                              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${language === lang.id ? 'bg-purple-500 text-white' : 'text-gray-500'}`}
                            >
                              {lang.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Unit System</p>
                          <p className="text-xs text-gray-500">Choose between Metric and Imperial</p>
                        </div>
                        <div className={`flex p-1 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                          <button 
                            onClick={() => setUnitSystem('metric')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${unitSystem === 'metric' ? 'bg-green-500 text-white' : 'text-gray-500'}`}
                          >
                            Metric
                          </button>
                          <button 
                            onClick={() => setUnitSystem('imperial')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${unitSystem === 'imperial' ? 'bg-green-500 text-white' : 'text-gray-500'}`}
                          >
                            Imperial
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Theme</p>
                          <p className="text-xs text-gray-500">Switch between light and dark mode</p>
                        </div>
                        <button 
                          onClick={() => setTheme(isDark ? 'light' : 'dark')}
                          className={`p-3 rounded-xl border transition-all ${isDark ? 'bg-white/10 border-white/10 text-yellow-500' : 'bg-black/5 border-black/5 text-indigo-600'}`}
                        >
                          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.analysisInterval}</label>
                          <span className="text-xs font-bold text-[var(--accent-cyan)]">{analysisInterval / 1000} {t.secondsLabel}</span>
                        </div>
                        <input 
                          type="range"
                          min="1000"
                          max="10000"
                          step="500"
                          value={analysisInterval}
                          onChange={(e) => setAnalysisInterval(parseInt(e.target.value))}
                          className="w-full accent-[var(--accent-cyan)]"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Notifications */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-5 h-5 text-orange-500" />
                      <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Voice Feedback</p>
                          <p className="text-xs text-gray-500">Enable AI voice guidance during workouts</p>
                        </div>
                        <button 
                          onClick={() => setVoiceEnabled(!voiceEnabled)}
                          className={`w-12 h-6 rounded-full transition-all relative ${voiceEnabled ? 'bg-orange-500' : 'bg-gray-600'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${voiceEnabled ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Workout Reminders</p>
                        <button 
                          onClick={() => setWorkoutReminders(!workoutReminders)}
                          className={`w-12 h-6 rounded-full transition-all relative ${workoutReminders ? 'bg-orange-500' : 'bg-gray-600'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${workoutReminders ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Meal Logging Reminders</p>
                        <button 
                          onClick={() => setMealReminders(!mealReminders)}
                          className={`w-12 h-6 rounded-full transition-all relative ${mealReminders ? 'bg-orange-500' : 'bg-gray-600'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${mealReminders ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>
                    </div>
                  </section>

                  {/* Danger Zone */}
                  <section className="pt-6 border-t border-red-500/20 space-y-6">
                    <div className="flex items-center gap-3">
                      <Trash2 className="w-5 h-5 text-red-500" />
                      <h3 className="text-lg font-bold text-red-500">Danger Zone</h3>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <button className="px-6 py-3 rounded-xl border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-500/10 transition-all">
                        Clear History
                      </button>
                      <button className="px-6 py-3 rounded-xl bg-red-500 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-all">
                        Delete Account
                      </button>
                    </div>
                  </section>
                </div>
              </div>

              <div className={`p-8 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold shadow-lg shadow-purple-500/20"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className={`shrink-0 w-full px-6 py-3 flex justify-between items-center ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-black/[0.03] border-black/10'} backdrop-blur-2xl border-b z-[100] sticky top-0`}>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="p-2 bg-gradient-to-br from-[var(--accent-cyan)] to-blue-500 rounded-lg shadow-[0_0_15px_rgba(0,229,255,0.3)]">
              <Activity className="text-black w-4 h-4" />
            </div>
            <h1 className="text-xl font-display font-bold tracking-tight premium-gradient hidden lg:block">FitForm AI</h1>
          </div>

          <nav className="hidden xl:flex items-center gap-0.5">
            {featuresList.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id as any)}
                className={`px-2 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                  view === item.id 
                    ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]' 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(true)}
              className="p-2.5 rounded-xl border border-white/10 hover:border-[var(--accent-cyan)]/50 transition-colors group"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-gray-400 group-hover:text-[var(--accent-cyan)]" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('report')}
              className="p-2.5 rounded-xl border border-white/10 hover:border-red-500/50 transition-colors group"
              title="Report Issue"
            >
              <AlertCircle className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
            </motion.button>
          </div>

          <div className="h-6 w-[1px] bg-white/10 mx-2" />

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={user ? logout : login}
            className={`flex items-center gap-3 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
              user 
                ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' 
                : 'bg-[var(--accent-cyan)] text-black hover:shadow-[0_0_20px_rgba(0,229,255,0.4)]'
            }`}
          >
            {user ? (
              <>
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center overflow-hidden border border-white/20">
                  {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : <UserIcon className="w-3 h-3" />}
                </div>
                <span className="hidden sm:inline">Log Out</span>
                <LogOut className="w-4 h-4" />
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </>
            )}
          </motion.button>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden z-10">
        {/* Global Decorative Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${isDark ? 'bg-blue-500' : 'bg-blue-200'}`} />
          <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${isDark ? 'bg-purple-500' : 'bg-purple-200'}`} />
        </div>

        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 overflow-y-auto custom-scrollbar flex flex-col"
            >
              <div className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto relative z-10">
                <header className="mb-12">
                  <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`text-4xl md:text-6xl font-display font-bold tracking-tight mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
                  >
                    {t.wellDone.split('!')[0]}, <span className="text-[var(--accent-cyan)]">{user?.displayName?.split(' ')[0] || 'Athlete'}</span>
                  </motion.h1>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t.keepItUp}
                  </p>
                </header>

                {/* Pillar Navigation */}
                <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-16">
                  {featuresList.map((pillar) => (
                    <motion.button
                      key={pillar.id}
                      whileHover={{ y: -5, scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setView(pillar.id as any)}
                      className="flex flex-col items-center gap-3 group"
                    >
                      <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[2rem] flex items-center justify-center border transition-all duration-300 ${pillar.bg} ${isDark ? 'border-white/10 group-hover:border-white/20' : 'border-black/5 group-hover:border-black/10 shadow-lg shadow-black/5'}`}>
                        <pillar.icon className={`w-8 h-8 md:w-10 md:h-10 ${pillar.color}`} />
                      </div>
                      <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500 group-hover:text-white' : 'text-gray-400 group-hover:text-black'} transition-colors`}>
                        {pillar.label}
                      </span>
                    </motion.button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {/* Quick Stats */}
                  <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 rounded-2xl bg-orange-500/20">
                        <Flame className="w-6 h-6 text-orange-500" />
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t.streak}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-5xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {workoutHistory.length > 0 ? 1 : 0}
                      </span>
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t.days}</span>
                    </div>
                  </div>

                  <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 rounded-2xl bg-[var(--accent-cyan)]/20">
                        <Zap className="w-6 h-6 text-[var(--accent-cyan)]" />
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t.points}</span>
                    </div>
                    <div className="text-5xl font-display font-bold text-[var(--accent-cyan)]">
                      {userPoints}
                    </div>
                  </div>

                  <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 rounded-2xl bg-green-500/20">
                        <Target className="w-6 h-6 text-green-500" />
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t.avgAccuracyLabel}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-5xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {workoutHistory.length > 0 
                          ? Math.round(workoutHistory.reduce((acc, curr) => acc + curr.avgAccuracy, 0) / workoutHistory.length)
                          : 0}%
                      </span>
                    </div>
                  </div>

                  <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 rounded-2xl bg-purple-500/20">
                        <Utensils className="w-6 h-6 text-purple-500" />
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t.calories}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-5xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {meals.reduce((acc, curr) => acc + (curr.calories || 0), 0)}
                      </span>
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>kcal</span>
                    </div>
                  </div>
                </div>

                {/* Main Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {featuresList.map((feature) => (
                    <motion.button
                      key={feature.id}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setView(feature.id as any)}
                      className={`${feature.colSpan === 2 ? 'md:col-span-2' : ''} p-10 rounded-[3rem] border relative overflow-hidden group text-left transition-all duration-300 ${isDark ? 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)]' : 'bg-white border-black/5 shadow-xl shadow-black/5 hover:shadow-2xl hover:border-black/10'}`}
                    >
                      {feature.colSpan === 2 ? (
                        <>
                          <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
                            {feature.bgIcon && <feature.bgIcon className="w-48 h-48" />}
                          </div>
                          <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                              <div className={`p-4 rounded-3xl ${feature.bg.replace('/10', '/20')} group-hover:scale-110 transition-transform duration-300`}>
                                <feature.icon className={`w-8 h-8 ${feature.color}`} />
                              </div>
                              <h2 className={`text-3xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{feature.label}</h2>
                            </div>
                            <p className={`text-lg mb-8 max-w-md ${isDark ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-800'} transition-colors duration-300`}>
                              {feature.description}
                            </p>
                            <div className={`flex items-center gap-2 ${feature.color} font-bold uppercase tracking-widest text-sm group-hover:translate-x-2 transition-transform duration-300`}>
                              {feature.buttonText} <ChevronRight className="w-5 h-5" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col h-full justify-between relative z-10">
                          <div className="absolute top-0 right-0 opacity-5 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500 -mr-8 -mt-8">
                             <feature.icon className="w-32 h-32" />
                          </div>
                          <div>
                            <div className={`p-4 rounded-3xl ${feature.bg.replace('/10', '/20')} w-fit mb-8 group-hover:scale-110 transition-transform duration-300`}>
                              <feature.icon className={`w-8 h-8 ${feature.color}`} />
                            </div>
                            <h2 className={`text-2xl font-display font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{feature.label}</h2>
                            <p className={`text-sm ${isDark ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-800'} transition-colors duration-300`}>
                              {feature.description}
                            </p>
                          </div>
                          <div className={`flex items-center gap-2 ${feature.color} font-bold uppercase tracking-widest text-xs mt-8 group-hover:translate-x-2 transition-transform duration-300`}>
                            {feature.buttonText} <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
              </div>
              <Footer isDark={isDark} />
            </motion.div>
          )}

          {view === 'outdoor' && (
            <motion.div
              key="outdoor"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 overflow-y-auto custom-scrollbar flex flex-col"
            >
              <div className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                <header className="mb-12 flex justify-between items-center">
                  <div>
                    <h1 className={`text-4xl font-display font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Outdoor Adventure</h1>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Climbing & Cycling routes across Malaysia.</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (isTrackingOutdoor) {
                        if (confirm("Stop tracking and save progress?")) {
                          setIsTrackingOutdoor(false);
                          setSelectedRoute(null);
                        }
                      } else {
                        setView('dashboard');
                      }
                    }}
                    className={`p-3 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/5 text-gray-900 shadow-lg'}`}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </motion.button>
                </header>

                {!selectedOutdoorActivity ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {OUTDOOR_ACTIVITIES.map((activity) => (
                      <motion.button
                        key={activity.id}
                        whileHover={{ y: -8 }}
                        onClick={() => setSelectedOutdoorActivity(activity)}
                        className={`p-10 rounded-[3rem] border relative overflow-hidden group text-left ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}
                      >
                        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                          <activity.icon className="w-48 h-48" />
                        </div>
                        <div className="relative z-10">
                          <div className={`p-4 rounded-3xl bg-orange-500/20 w-fit mb-8`}>
                            <activity.icon className="w-8 h-8 text-orange-500" />
                          </div>
                          <h2 className={`text-3xl font-display font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{activity.name}</h2>
                          <p className={`text-lg mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{activity.description}</p>
                          <div className="flex items-center gap-2 text-orange-500 font-bold uppercase tracking-widest text-sm">
                            View Routes <ChevronRight className="w-5 h-5" />
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : !selectedRoute ? (
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setSelectedOutdoorActivity(null)}
                        className={`p-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/5 text-gray-900'}`}
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h2 className={`text-2xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedOutdoorActivity.name} Routes</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {selectedOutdoorActivity.routes.map((route: any) => (
                        <motion.div
                          key={route.id}
                          whileHover={{ y: -4 }}
                          className={`p-6 rounded-[2.5rem] border flex flex-col gap-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}
                        >
                          <div className="aspect-video rounded-3xl bg-gray-800 overflow-hidden relative">
                            <iframe
                              width="100%"
                              height="100%"
                              frameBorder="0"
                              style={{ border: 0 }}
                              src={`https://www.google.com/maps/embed/v1/view?key=${(import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || ''}&center=${route.lat},${route.lng}&zoom=14&maptype=satellite`}
                              allowFullScreen
                            ></iframe>
                            <div className="absolute top-4 right-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-black/40 backdrop-blur-md text-white border-white/10`}>
                                {route.difficulty}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className={`text-xl font-display font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{route.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                              <MapPin className="w-4 h-4" />
                              {route.location}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Navigation className="w-4 h-4 text-orange-500" />
                                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{route.distance} km</span>
                              </div>
                              <button 
                                onClick={() => setSelectedRoute(route)}
                                className="px-6 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold uppercase tracking-widest hover:bg-orange-600 transition-colors"
                              >
                                Select Route
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      <div className={`aspect-video rounded-[3rem] border overflow-hidden relative ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                        <iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          style={{ border: 0 }}
                          src={`https://www.google.com/maps/embed/v1/place?key=${(import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${selectedRoute.lat},${selectedRoute.lng}&zoom=15`}
                          allowFullScreen
                        ></iframe>
                        <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end pointer-events-none">
                          <div className="p-6 rounded-3xl bg-black/60 backdrop-blur-xl border border-white/10 text-white pointer-events-auto">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Current Location</p>
                            <p className="font-bold">{selectedRoute.name}</p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedRoute.lat},${selectedRoute.lng}`;
                              window.open(url, '_blank');
                            }}
                            className="p-4 rounded-full bg-blue-500 text-white shadow-xl shadow-blue-500/20 pointer-events-auto"
                          >
                            <Navigation className="w-6 h-6" />
                          </motion.button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Distance</p>
                          <p className={`text-2xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{outdoorDistance.toFixed(2)} km</p>
                        </div>
                        <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Points Earned</p>
                          <p className="text-2xl font-display font-bold text-orange-500">+{outdoorPoints}</p>
                        </div>
                        <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Difficulty</p>
                          <p className={`text-2xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedRoute.difficulty}</p>
                        </div>
                        <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Goal</p>
                          <p className={`text-2xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedRoute.distance} km</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className={`p-8 rounded-[3rem] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}>
                        <h3 className={`text-xl font-display font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Activity Tracking</h3>
                        <div className="space-y-6">
                          {!isTrackingOutdoor ? (
                            <button 
                              onClick={() => {
                                setIsTrackingOutdoor(true);
                                setOutdoorDistance(0);
                                setOutdoorPoints(0);
                              }}
                              className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all flex items-center justify-center gap-3"
                            >
                              <Play className="w-5 h-5" />
                              Start Tracking
                            </button>
                          ) : (
                            <div className="space-y-4">
                              <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-4">
                                <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                                <span className="text-sm font-bold text-orange-500 uppercase tracking-widest">Tracking Live...</span>
                              </div>
                              <button 
                                onClick={async () => {
                                  // Simulate distance increase
                                  const newDist = outdoorDistance + 1;
                                  const pointsAwarded = Math.floor(Math.random() * 3) + 1;
                                  setOutdoorDistance(newDist);
                                  setOutdoorPoints(prev => prev + pointsAwarded);
                                  
                                  if (user) {
                                    const userRef = doc(db, 'users', user.uid);
                                    await setDoc(userRef, { points: userPoints + pointsAwarded }, { merge: true });
                                  }
                                }}
                                className={`w-full py-4 rounded-2xl border font-bold transition-all flex items-center justify-center gap-3 ${isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-gray-50 border-black/5 text-gray-900 hover:bg-gray-100'}`}
                              >
                                <Footprints className="w-5 h-5" />
                                Simulate 1km
                              </button>
                              <button 
                                onClick={async () => {
                                  setIsTrackingOutdoor(false);
                                  if (user) {
                                    try {
                                      await addDoc(collection(db, 'users', user.uid, 'outdoor_activities'), {
                                        userId: user.uid,
                                        activityType: selectedOutdoorActivity.type,
                                        routeName: selectedRoute.name,
                                        distance: outdoorDistance,
                                        pointsEarned: outdoorPoints,
                                        timestamp: Timestamp.now()
                                      });
                                    } catch (err) {
                                      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/outdoor_activities`);
                                    }
                                  }
                                  setSelectedRoute(null);
                                }}
                                className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all flex items-center justify-center gap-3"
                              >
                                <Square className="w-5 h-5" />
                                Stop & Save
                              </button>
                            </div>
                          )}
                          
                          <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-black/5'}`}>
                            <div className="flex items-center gap-3 mb-4">
                              <Info className="w-4 h-4 text-blue-500" />
                              <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Point System</p>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              Earn 1-3 points randomly for every 1km tracked. Points are automatically added to your MyPoints balance.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              </div>
              <Footer isDark={isDark} />
            </motion.div>
          )}

          {view === 'healthcare' && (
            <motion.div
              key="healthcare"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 overflow-y-auto custom-scrollbar flex flex-col"
            >
              <div className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                <header className="mb-12 flex justify-between items-center">
                  <div>
                    <h1 className={`text-4xl font-display font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.healthcare}</h1>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t.nearbyPartners}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setView('dashboard')}
                    className={`p-3 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/5 text-gray-900 shadow-lg'}`}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </motion.button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    {PARTNERS.map(partner => (
                      <motion.div
                        key={partner.id}
                        whileHover={{ y: -4 }}
                        className={`p-6 rounded-[2.5rem] border flex flex-col md:flex-row gap-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}
                      >
                        <div className={`w-full md:w-48 h-32 rounded-3xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center`}>
                          <Hospital className="w-12 h-12 text-red-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className={`text-xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{partner.name}</h3>
                            <div className="flex items-center gap-1 text-yellow-500">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-sm font-bold">{partner.rating}</span>
                            </div>
                          </div>
                          <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{partner.type} • {partner.address}</p>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
                              <MapPin className="w-3 h-3" />
                              {partner.distance}
                            </div>
                            <button 
                              onClick={async () => {
                                if (!user) return login();
                                try {
                                  await addDoc(collection(db, 'users', user.uid, 'bookings'), {
                                    userId: user.uid,
                                    centerName: partner.name,
                                    appointmentTime: Timestamp.fromDate(new Date(Date.now() + 86400000)), // Tomorrow
                                    status: 'pending'
                                  });
                                  alert("Booking requested! We will contact you shortly.");
                                } catch (err) {
                                  handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/bookings`);
                                }
                              }}
                              className="px-6 py-2 rounded-xl bg-red-500 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-colors"
                            >
                              {t.bookAppointment}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="space-y-6">
                    <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}>
                      <h2 className={`text-xl font-display font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.booking}</h2>
                      {bookings.length > 0 ? (
                        <div className="space-y-4">
                          {bookings.map(booking => (
                            <div key={booking.id} className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-black/5'}`}>
                              <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{booking.centerName}</p>
                              <p className="text-[10px] text-gray-500 mt-1">{new Date(booking.date).toLocaleString()}</p>
                              <span className={`inline-block mt-2 px-2 py-1 rounded-md text-[8px] font-bold uppercase tracking-widest ${
                                booking.status === 'confirmed' ? 'bg-green-500/20 text-green-500' : 
                                booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-500/20 text-gray-500'
                              }`}>
                                {booking.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={`text-sm text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No active bookings.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              </div>
              <Footer isDark={isDark} />
            </motion.div>
          )}

          {view === 'rewards' && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 overflow-y-auto custom-scrollbar flex flex-col"
            >
              <div className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h1 className={`text-4xl font-display font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.rewards}</h1>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t.availableVouchers}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className={`flex items-center gap-2 px-6 py-3 rounded-2xl border ${isDark ? 'bg-pink-500/10 border-pink-500/20' : 'bg-pink-50 border-pink-100 shadow-sm'}`}>
                      <Zap className="w-5 h-5 text-pink-500" />
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>My Points</span>
                        <span className={`text-lg font-bold leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>{userPoints}</span>
                      </div>
                    </div>
                    <div className={`flex items-center p-1 rounded-xl border backdrop-blur-2xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                      {['All', 'F&B', 'Cash', 'Service', 'Gadget'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setRewardCategoryFilter(cat as any)}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                            rewardCategoryFilter === cat 
                              ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' 
                              : 'text-gray-500 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setView('dashboard')}
                      className={`p-3 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/5 text-gray-900 shadow-lg'}`}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </motion.button>
                  </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {REWARDS.filter(r => rewardCategoryFilter === 'All' || r.category === rewardCategoryFilter).map(reward => (
                    <motion.div
                      key={reward.id}
                      layout
                      whileHover={{ y: -8 }}
                      className={`p-8 rounded-[3rem] border relative overflow-hidden group transition-all duration-300 ${
                        isDark ? 'bg-white/5 border-white/10 hover:border-pink-500/50' : 'bg-white border-black/5 shadow-xl shadow-black/5 hover:border-pink-500/50'
                      }`}
                    >
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <reward.icon className="w-32 h-32" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                          <div className={`p-4 rounded-3xl bg-pink-500/20 w-fit`}>
                            <reward.icon className="w-8 h-8 text-pink-500" />
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                            isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-100 border-black/5 text-gray-500'
                          }`}>
                            {reward.category}
                          </span>
                        </div>
                        
                        <h3 className={`text-2xl font-display font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{reward.name}</h3>
                        <p className={`text-sm mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Provided by {reward.provider}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{reward.cost}</span>
                          </div>
                          <button 
                            disabled={userPoints < reward.cost}
                            onClick={async () => {
                              if (!user) return login();
                              if (userPoints < reward.cost) return;
                              try {
                                const userRef = doc(db, 'users', user.uid);
                                await setDoc(userRef, { points: userPoints - reward.cost }, { merge: true });
                                alert(`Successfully redeemed ${reward.name}! Your code: FITFORM-${Math.random().toString(36).substring(7).toUpperCase()}`);
                              } catch (err) {
                                handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
                              }
                            }}
                            className={`px-8 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all ${
                              userPoints >= reward.cost 
                                ? 'bg-pink-500 text-white hover:bg-pink-600 shadow-lg shadow-pink-500/20' 
                                : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {t.redeem}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              </div>
              <Footer isDark={isDark} />
            </motion.div>
          )}

          {view === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 overflow-y-auto custom-scrollbar flex flex-col"
            >
              <div className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h1 className={`text-5xl font-display font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Performance <span className="text-[var(--accent-cyan)]">Intelligence</span></h1>
                    <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Deep statistical analysis of your biomechanical data</p>
                  </div>
                  <div className="flex gap-4 items-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={exportToPDF}
                      className={`hidden md:flex items-center gap-2 px-6 py-2 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10 text-[var(--accent-cyan)]' : 'bg-white border-black/5 text-[var(--accent-cyan)] shadow-lg'}`}
                      title="Export PDF Report"
                    >
                      <Download className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-widest">{t.downloadPDF || 'Export'}</span>
                    </motion.button>
                    <div className={`flex items-center p-1.5 rounded-2xl border backdrop-blur-2xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                      {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setAnalyticsPeriod(p)}
                          className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                            analyticsPeriod === p 
                              ? 'bg-[var(--accent-cyan)] text-black shadow-lg shadow-[var(--accent-cyan)]/20' 
                              : 'text-gray-500 hover:text-white'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setView('dashboard')}
                      className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/5 text-gray-900 shadow-lg'}`}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </motion.button>
                  </div>
                </header>

                {/* Top Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Avg Accuracy', value: `${workoutHistory.length > 0 ? Math.round(workoutHistory.reduce((acc, curr) => acc + curr.avgAccuracy, 0) / workoutHistory.length) : 0}%`, icon: Target, color: 'text-blue-500', trend: '+2.4%' },
                    { label: 'Total Energy', value: `${meals.reduce((acc, curr) => acc + (curr.calories || 0), 0)}`, unit: 'kcal', icon: Flame, color: 'text-orange-500', trend: '-120' },
                    { label: 'Workout Streak', value: workoutHistory.length > 0 ? 1 : 0, unit: 'days', icon: Zap, color: 'text-yellow-500', trend: 'Stable' },
                    { label: 'Loyalty Points', value: userPoints, icon: Award, color: 'text-purple-500', trend: `+${outdoorHistory.reduce((acc, curr) => acc + (curr.pointsEarned || 0), 0)}` },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`p-8 rounded-[2.5rem] border relative overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className={`p-3 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                          <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${stat.trend.startsWith('+') ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                          {stat.trend}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-4xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</span>
                          {stat.unit && <span className="text-sm font-medium text-gray-500">{stat.unit}</span>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Main Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Accuracy Area Chart */}
                  <div className={`p-10 rounded-[3rem] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}>
                    <div className="flex justify-between items-center mb-10">
                      <h3 className={`text-2xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Accuracy <span className="text-blue-500">Dynamics</span></h3>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        Real-time Score
                      </div>
                    </div>
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={workoutHistory.slice().reverse()}>
                          <defs>
                            <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(str) => new Date(str).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            stroke={isDark ? "#444" : "#ccc"}
                            fontSize={10}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis stroke={isDark ? "#444" : "#ccc"} fontSize={10} axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: isDark ? '#1A1D23' : '#fff', border: 'none', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
                            itemStyle={{ color: '#3B82F6', fontWeight: 'bold' }}
                          />
                          <Area type="monotone" dataKey="avgAccuracy" stroke="#3B82F6" fillOpacity={1} fill="url(#colorAcc)" strokeWidth={4} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Muscle Group Radar Chart */}
                  <div className={`p-10 rounded-[3rem] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}>
                    <h3 className={`text-2xl font-display font-bold mb-10 ${isDark ? 'text-white' : 'text-gray-900'}`}>Muscle <span className="text-purple-500">Distribution</span></h3>
                    <div className="h-[350px] w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                          { subject: 'Upper Body', A: 85, fullMark: 150 },
                          { subject: 'Lower Body', A: 98, fullMark: 150 },
                          { subject: 'Core', A: 70, fullMark: 150 },
                          { subject: 'Cardio', A: 110, fullMark: 150 },
                          { subject: 'Mobility', A: 65, fullMark: 150 },
                          { subject: 'Balance', A: 90, fullMark: 150 },
                        ]}>
                          <PolarGrid stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
                          <PolarAngleAxis dataKey="subject" stroke={isDark ? "#666" : "#999"} fontSize={10} />
                          <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                          <Radar name="Activity" dataKey="A" stroke="#A855F7" fill="#A855F7" fillOpacity={0.5} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: AI Summary & Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* AI Summary Card */}
                  <div className={`p-10 rounded-[3rem] border flex flex-col relative overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}>
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <BarChart2 className="w-32 h-32" />
                    </div>
                    <h3 className={`text-2xl font-display font-bold mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>AI <span className="text-green-500">Insights</span></h3>
                    <div className="flex-1">
                      {aiAnalyticsSummary ? (
                        <div className={`p-8 rounded-[2rem] ${isDark ? 'bg-white/5' : 'bg-gray-50'} border border-white/5 relative`}>
                          <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg">
                            <Info className="w-4 h-4" />
                          </div>
                          <p className={`text-lg leading-relaxed italic ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>"{aiAnalyticsSummary}"</p>
                        </div>
                      ) : (
                        <div className="text-center py-12 space-y-6">
                          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                            <BarChart3 className="w-10 h-10 text-green-500" />
                          </div>
                          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'} max-w-[200px] mx-auto`}>Generate an AI executive summary of your performance.</p>
                        </div>
                      )}
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={generateAnalyticsSummary}
                      disabled={isGeneratingSummary || workoutHistory.length === 0}
                      className={`mt-10 w-full py-5 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all shadow-xl ${
                        isGeneratingSummary 
                          ? 'bg-gray-500/20 text-gray-500' 
                          : 'bg-green-500 text-white hover:bg-green-600 shadow-green-500/20'
                      }`}
                    >
                      {isGeneratingSummary ? 'Processing Intelligence...' : 'Generate AI Summary'}
                    </motion.button>
                  </div>

                  {/* Activity History */}
                  <div className={`lg:col-span-2 p-10 rounded-[3rem] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}>
                    <div className="flex justify-between items-center mb-10">
                      <h3 className={`text-2xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Activity <span className="text-orange-500">Log</span></h3>
                      <button className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors">View All</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Recent Workouts</p>
                        {workoutHistory.slice(0, 4).map(session => (
                          <div key={session.id} className={`p-5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-black/5'} flex items-center justify-between group hover:border-[var(--accent-cyan)]/30 transition-all`}>
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-[var(--accent-cyan)]/10 flex items-center justify-center text-[var(--accent-cyan)]">
                                <Dumbbell className="w-5 h-5" />
                              </div>
                              <div>
                                <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{session.exerciseName}</p>
                                <p className="text-[10px] text-gray-500">{new Date(session.date).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-[var(--accent-cyan)]">{session.avgAccuracy}%</p>
                              <p className="text-[10px] text-gray-500">{Math.floor(session.duration / 60)}m</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-4">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Outdoor Adventures</p>
                        {outdoorHistory.slice(0, 4).map(activity => (
                          <div key={activity.id} className={`p-5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-black/5'} flex items-center justify-between group hover:border-orange-500/30 transition-all`}>
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activity.activityType === 'Cycling' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                {activity.activityType === 'Cycling' ? <Bike className="w-5 h-5" /> : <Mountain className="w-5 h-5" />}
                              </div>
                              <div>
                                <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{activity.routeName}</p>
                                <p className="text-[10px] text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-orange-500">+{activity.pointsEarned} pts</p>
                              <p className="text-[10px] text-gray-500">{activity.distance} km</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
              <Footer isDark={isDark} />
            </motion.div>
          )}

          {view === 'recovery' && (
            <motion.div
              key="recovery"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 overflow-y-auto custom-scrollbar flex flex-col"
            >
              <div className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                <header className="mb-12 flex justify-between items-center">
                  <div>
                    <h1 className={`text-4xl font-display font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.recovery}</h1>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t.warmUp} & {t.coolDown}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setView('dashboard')}
                    className={`p-3 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/5 text-gray-900 shadow-lg'}`}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </motion.button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {RECOVERY_ROUTINES.map(routine => (
                    <motion.div
                      key={routine.id}
                      whileHover={{ scale: 1.02 }}
                      className={`p-10 rounded-[3rem] border relative overflow-hidden group ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}
                    >
                      <div className="flex justify-between items-start mb-8">
                        <div className={`p-4 rounded-3xl ${routine.id.startsWith('w') ? 'bg-orange-500/20' : 'bg-blue-500/20'}`}>
                          {routine.id.startsWith('w') ? <Flame className="w-8 h-8 text-orange-500" /> : <Wind className="w-8 h-8 text-blue-500" />}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                          <Clock className="w-4 h-4" />
                          {routine.duration}
                        </div>
                      </div>
                      <h3 className={`text-2xl font-display font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>{routine.name}</h3>
                      <div className="space-y-3 mb-10">
                        {routine.exercises.map((ex, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)]" />
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{ex.name} <span className="text-gray-500">({ex.duration}s)</span></span>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => {
                          setActiveRoutine(routine);
                          setRoutineStep(0);
                          setRoutineTimeLeft(routine.exercises[0].duration);
                          setIsRoutinePaused(false);
                        }}
                        className="w-full py-4 rounded-2xl bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors"
                      >
                        Start Routine
                      </button>
                    </motion.div>
                  ))}
                </div>

                {/* Active Routine Modal */}
                <AnimatePresence>
                  {activeRoutine && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="w-full max-w-2xl p-8 md:p-12 rounded-[3rem] border border-white/10 bg-[#1A1D23] text-center relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 h-2 bg-gray-800 w-full">
                          <div 
                            className="h-full bg-[var(--accent-cyan)] transition-all duration-1000 ease-linear"
                            style={{ width: `${((activeRoutine.exercises[routineStep].duration - routineTimeLeft) / activeRoutine.exercises[routineStep].duration) * 100}%` }}
                          />
                        </div>
                        
                        <div className="mb-8">
                          <span className="text-[var(--accent-cyan)] font-bold uppercase tracking-widest text-sm">
                            Exercise {routineStep + 1} of {activeRoutine.exercises.length}
                          </span>
                          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mt-4 mb-4">
                            {activeRoutine.exercises[routineStep].name}
                          </h2>
                          <p className="text-xl text-gray-400">
                            {activeRoutine.exercises[routineStep].guidance}
                          </p>
                        </div>

                        <div className="text-8xl md:text-9xl font-display font-bold text-white mb-12 tabular-nums">
                          {routineTimeLeft}
                        </div>

                        <div className="flex items-center justify-center gap-6">
                          <button 
                            onClick={() => setIsRoutinePaused(!isRoutinePaused)}
                            className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                          >
                            {isRoutinePaused ? <Play className="w-8 h-8 ml-2" /> : <Pause className="w-8 h-8" />}
                          </button>
                          <button 
                            onClick={() => {
                              if (routineStep < activeRoutine.exercises.length - 1) {
                                setRoutineStep(prev => prev + 1);
                                setRoutineTimeLeft(activeRoutine.exercises[routineStep + 1].duration);
                              } else {
                                setActiveRoutine(null);
                              }
                            }}
                            className="w-20 h-20 rounded-full bg-[var(--accent-cyan)] flex items-center justify-center text-black hover:bg-[var(--accent-cyan)]/80 transition-colors"
                          >
                            {routineStep < activeRoutine.exercises.length - 1 ? <ChevronRight className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                          </button>
                        </div>

                        <button 
                          onClick={() => setActiveRoutine(null)}
                          className="absolute top-6 right-6 p-3 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <Square className="w-5 h-5" />
                        </button>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
              </div>
              <Footer isDark={isDark} />
            </motion.div>
          )}

          {view === 'nutrition' && (
            <motion.div
              key="nutrition"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 overflow-y-auto custom-scrollbar flex flex-col"
            >
              <div className="flex-1">
                <div className="max-w-7xl mx-auto p-4 md:p-8">
                {/* Hero Section: AI Nutrition Scanner */}
                <section className="relative mb-12 rounded-[3rem] overflow-hidden border border-white/10 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 p-8 md:p-12">
                  <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none" />
                  <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-widest mb-6">
                      <Scan className="w-4 h-4" />
                      AI Nutrition Scanner
                    </div>
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 leading-tight">
                      Know exactly what's in <span className="premium-gradient">your food.</span>
                    </h1>
                    <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                      Snap a photo or upload an image of your meal. Our AI identifies ingredients and calculates precise macro-nutrition in seconds.
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setScannerModalOpen(true);
                          setScannerMode('camera');
                          setScanResult(null);
                          setScanError(null);
                        }}
                        className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-purple-500 text-white font-bold shadow-lg shadow-purple-500/20 hover:bg-purple-600 transition-all"
                      >
                        <Camera className="w-5 h-5" />
                        Open Camera to Scan
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e: any) => handleFileUpload(e);
                          input.click();
                        }}
                        className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/10 border border-white/10 text-white font-bold hover:bg-white/20 transition-all backdrop-blur-md"
                      >
                        <Plus className="w-5 h-5" />
                        Upload Food Photo
                      </motion.button>
                    </div>
                  </div>
                </section>

                {/* Manual Record Nutrition Section */}
                <section className="mb-12">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className={`text-3xl font-display font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Manual Record</h2>
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Log your custom meals and snacks manually.</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setManualLogOpen(!manualLogOpen)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
                        manualLogOpen 
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                          : 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                      }`}
                    >
                      {manualLogOpen ? <Plus className="w-5 h-5 rotate-45" /> : <Plus className="w-5 h-5" />}
                      {manualLogOpen ? 'Close Form' : 'Add Manual Entry'}
                    </motion.button>
                  </div>

                  <AnimatePresence>
                    {manualLogOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-8"
                      >
                        <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}>
                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!user) return login();
                            const formData = new FormData(e.currentTarget);
                            try {
                              await addDoc(collection(db, 'users', user.uid, 'meals'), {
                                userId: user.uid,
                                foodName: formData.get('foodName'),
                                calories: Number(formData.get('calories')),
                                protein: Number(formData.get('protein')),
                                carbs: Number(formData.get('carbs')),
                                fats: Number(formData.get('fats')),
                                timestamp: Timestamp.now()
                              });
                              (e.target as HTMLFormElement).reset();
                              setManualFood('');
                              setManualWeight(100);
                              setManualLogOpen(false);
                            } catch (err) {
                              handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/meals`);
                            }
                          }} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-2 md:col-span-2">
                                <label className={`text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Meal Name</label>
                                <input 
                                  name="foodName" 
                                  list="common-foods"
                                  value={manualFood}
                                  onChange={(e) => setManualFood(e.target.value)}
                                  placeholder="e.g. Chicken Breast (Cooked)" 
                                  required 
                                  className={`w-full px-6 py-4 rounded-2xl border transition-all outline-none focus:ring-2 focus:ring-purple-500/50 ${
                                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-black/5 text-gray-900'
                                  }`} 
                                />
                                <datalist id="common-foods">
                                  {COMMON_FOODS.map(f => <option key={f.name} value={f.name} />)}
                                </datalist>
                              </div>
                              <div className="space-y-2">
                                <label className={`text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Weight (g)</label>
                                <input 
                                  type="number" 
                                  value={manualWeight}
                                  onChange={(e) => setManualWeight(Number(e.target.value))}
                                  min="1"
                                  className={`w-full px-6 py-4 rounded-2xl border transition-all outline-none focus:ring-2 focus:ring-purple-500/50 ${
                                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-black/5 text-gray-900'
                                  }`} 
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              <div className="space-y-2">
                                <label className={`text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Calories (kcal)</label>
                                <input 
                                  name="calories" 
                                  type="number" 
                                  value={manualMacros.calories || ''}
                                  onChange={(e) => setManualMacros({...manualMacros, calories: Number(e.target.value)})}
                                  placeholder="0" 
                                  required 
                                  className={`w-full px-6 py-4 rounded-2xl border transition-all outline-none focus:ring-2 focus:ring-purple-500/50 ${
                                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-black/5 text-gray-900'
                                  }`} 
                                />
                              </div>
                              <div className="space-y-2">
                                <label className={`text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Protein (g)</label>
                                <input 
                                  name="protein" 
                                  type="number" 
                                  step="0.1"
                                  value={manualMacros.protein || ''}
                                  onChange={(e) => setManualMacros({...manualMacros, protein: Number(e.target.value)})}
                                  placeholder="0" 
                                  className={`w-full px-6 py-4 rounded-2xl border transition-all outline-none focus:ring-2 focus:ring-purple-500/50 ${
                                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-black/5 text-gray-900'
                                  }`} 
                                />
                              </div>
                              <div className="space-y-2">
                                <label className={`text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Carbs (g)</label>
                                <input 
                                  name="carbs" 
                                  type="number" 
                                  step="0.1"
                                  value={manualMacros.carbs || ''}
                                  onChange={(e) => setManualMacros({...manualMacros, carbs: Number(e.target.value)})}
                                  placeholder="0" 
                                  className={`w-full px-6 py-4 rounded-2xl border transition-all outline-none focus:ring-2 focus:ring-purple-500/50 ${
                                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-black/5 text-gray-900'
                                  }`} 
                                />
                              </div>
                              <div className="space-y-2">
                                <label className={`text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Fats (g)</label>
                                <input 
                                  name="fats" 
                                  type="number" 
                                  step="0.1"
                                  value={manualMacros.fats || ''}
                                  onChange={(e) => setManualMacros({...manualMacros, fats: Number(e.target.value)})}
                                  placeholder="0" 
                                  className={`w-full px-6 py-4 rounded-2xl border transition-all outline-none focus:ring-2 focus:ring-purple-500/50 ${
                                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-black/5 text-gray-900'
                                  }`} 
                                />
                              </div>
                            </div>

                            <button 
                              type="submit" 
                              className="w-full py-5 rounded-2xl bg-purple-500 text-white font-bold text-lg shadow-xl shadow-purple-500/20 hover:bg-purple-600 transition-all"
                            >
                              Log Manual Entry
                            </button>
                          </form>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Recent Manual Logs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {meals.slice(0, 3).map((meal) => (
                      <div 
                        key={meal.id} 
                        className={`p-6 rounded-[2rem] border flex items-center gap-4 transition-all ${
                          isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-sm'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{meal.foodName}</p>
                          <p className="text-xs text-gray-500">{new Date(meal.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-purple-500">{meal.calories} kcal</p>
                          <div className="flex gap-1 mt-1">
                            <span className="text-[8px] font-bold text-gray-500 uppercase">P:{meal.protein}g</span>
                            <span className="text-[8px] font-bold text-gray-500 uppercase">C:{meal.carbs}g</span>
                            <span className="text-[8px] font-bold text-gray-500 uppercase">F:{meal.fats}g</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {meals.length === 0 && (
                      <div className={`col-span-full p-12 rounded-[2rem] border border-dashed flex flex-col items-center justify-center text-center ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                          <FileText className="w-8 h-8 text-gray-500" />
                        </div>
                        <p className="text-gray-500 font-medium">No manual logs yet. Start tracking your meals!</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Meal Prep Hub */}
                <section className="mb-12">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                      <h2 className={`text-3xl font-display font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Meal Prep Hub</h2>
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Browse fitness-focused recipes tailored for your goals.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setMealCategoryFilter(cat as any)}
                          className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                            mealCategoryFilter === cat
                              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                              : isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {MEALS.filter(m => mealCategoryFilter === 'All' || m.category === mealCategoryFilter).map((meal) => (
                      <motion.div
                        key={meal.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -8 }}
                        onClick={() => setSelectedMeal(meal)}
                        className={`group cursor-pointer rounded-[2rem] border overflow-hidden transition-all duration-300 ${
                          isDark ? 'bg-white/5 border-white/10 hover:border-purple-500/50' : 'bg-white border-black/5 shadow-sm hover:shadow-xl'
                        }`}
                      >
                        <div className="aspect-[4/3] overflow-hidden relative">
                          <img 
                            src={meal.image} 
                            alt={meal.mealName} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-4 left-4">
                            <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest border border-white/10">
                              {meal.category}
                            </span>
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className={`text-lg font-bold mb-4 line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{meal.mealName}</h3>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Flame className="w-4 h-4 text-orange-500" />
                              <span className={`text-sm font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{meal.calories} kcal</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className={`p-2 rounded-xl text-center border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-black/5'}`}>
                              <p className="text-[10px] text-gray-500 uppercase font-bold">Prot</p>
                              <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{meal.protein}g</p>
                            </div>
                            <div className={`p-2 rounded-xl text-center border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-black/5'}`}>
                              <p className="text-[10px] text-gray-500 uppercase font-bold">Carb</p>
                              <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{meal.carbs}g</p>
                            </div>
                            <div className={`p-2 rounded-xl text-center border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-black/5'}`}>
                              <p className="text-[10px] text-gray-500 uppercase font-bold">Fat</p>
                              <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{meal.fat}g</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              </div>

              {/* AI Scanner Modal */}
              <AnimatePresence>
                {scannerModalOpen && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setScannerModalOpen(false)}
                      className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className={`relative w-full max-w-md rounded-[2.5rem] border overflow-hidden shadow-2xl ${isDark ? 'bg-[#1A1D23] border-white/10' : 'bg-white border-black/5'}`}
                    >
                      <div className="p-8">
                        {scannerMode === 'camera' ? (
                          <div className="flex flex-col items-center gap-6">
                            <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-black border border-white/10">
                              <Webcam
                                ref={nutritionWebcamRef}
                                audio={false}
                                screenshotFormat="image/jpeg"
                                className="w-full h-full object-cover"
                                videoConstraints={{ facingMode: cameraFacingMode }}
                              />
                              <button
                                onClick={() => setCameraFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                                className="absolute top-4 right-4 p-3 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 hover:bg-black/60 transition-all z-30"
                              >
                                <RefreshCcw className="w-5 h-5" />
                              </button>
                              <div className="absolute inset-0 border-2 border-purple-500/30 pointer-events-none" />
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-dashed border-white/50 rounded-full pointer-events-none" />
                            </div>
                            <div className="flex gap-4 w-full">
                              <button
                                onClick={() => setScannerMode('upload')}
                                className={`flex-1 py-4 rounded-2xl font-bold transition-all ${isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
                              >
                                Use Upload
                              </button>
                              <button
                                onClick={captureFoodPhoto}
                                className="flex-1 py-4 rounded-2xl bg-purple-500 text-white font-bold hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                              >
                                <Camera className="w-5 h-5" />
                                Capture
                              </button>
                            </div>
                          </div>
                        ) : scannerMode === 'upload' ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
                              <Plus className="w-10 h-10 text-purple-500" />
                            </div>
                            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Upload Food Photo</h3>
                            <p className="text-gray-500 text-sm mb-8">Select an image from your gallery for AI analysis</p>
                            <div className="flex gap-4 w-full">
                              <button
                                onClick={() => setScannerMode('camera')}
                                className={`flex-1 py-4 rounded-2xl font-bold transition-all ${isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
                              >
                                Use Camera
                              </button>
                              <label className="flex-1 py-4 rounded-2xl bg-purple-500 text-white font-bold hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer">
                                <Plus className="w-5 h-5" />
                                Choose File
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                              </label>
                            </div>
                          </div>
                        ) : isScanning ? (
                          <div className="flex flex-col items-center justify-center py-12">
                            <div className="relative w-24 h-24 mb-8">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 rounded-full border-4 border-purple-500/20 border-t-purple-500"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Scan className="w-8 h-8 text-purple-500" />
                              </div>
                            </div>
                            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Analyzing Macros...</h3>
                            <p className="text-gray-500 text-sm">Identifying ingredients and portion sizes</p>
                          </div>
                        ) : scanError ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                              <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Analysis Error</h3>
                            <p className="text-gray-500 text-sm mb-8">{scanError}</p>
                            <button
                              onClick={() => {
                                setScannerMode('camera');
                                setScanError(null);
                              }}
                              className="px-8 py-3 rounded-xl bg-purple-500 text-white font-bold"
                            >
                              Try Again
                            </button>
                          </div>
                        ) : scanResult && (
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <h3 className={`text-2xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Scan Result</h3>
                              <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-widest">
                                {scanResult.confidence}% Confidence
                              </div>
                            </div>
                            
                            <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-black/5'}`}>
                              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Identified Food</p>
                              <p className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{scanResult.name}</p>
                              {scanResult.weight && <p className="text-sm text-gray-500 mb-6">Estimated Weight: {scanResult.weight}</p>}
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <p className="text-gray-500 text-[10px] uppercase font-bold">Calories</p>
                                  <p className="text-xl font-bold text-purple-500">{scanResult.calories} kcal</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-gray-500 text-[10px] uppercase font-bold">Protein</p>
                                  <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{scanResult.protein}g</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-gray-500 text-[10px] uppercase font-bold">Carbs</p>
                                  <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{scanResult.carbs}g</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-gray-500 text-[10px] uppercase font-bold">Fat</p>
                                  <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{scanResult.fat}g</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-4">
                              <button
                                onClick={() => setScannerModalOpen(false)}
                                className={`flex-1 py-4 rounded-2xl font-bold transition-all ${isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={async () => {
                                  if (!user) return login();
                                  try {
                                    await addDoc(collection(db, 'users', user.uid, 'meals'), {
                                      userId: user.uid,
                                      foodName: scanResult.name,
                                      calories: scanResult.calories,
                                      protein: scanResult.protein,
                                      carbs: scanResult.carbs,
                                      fats: scanResult.fat,
                                      timestamp: Timestamp.now()
                                    });
                                    setScannerModalOpen(false);
                                  } catch (err) {
                                    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/meals`);
                                  }
                                }}
                                className="flex-1 py-4 rounded-2xl bg-purple-500 text-white font-bold hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20"
                              >
                                Log to Records
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Meal Detail Modal */}
              <AnimatePresence>
                {selectedMeal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSelectedMeal(null)}
                      className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-[3rem] border shadow-2xl ${isDark ? 'bg-[#1A1D23] border-white/10' : 'bg-white border-black/5'}`}
                    >
                      <div className="relative h-64 md:h-80">
                        <img 
                          src={selectedMeal.image} 
                          alt={selectedMeal.mealName} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D23] via-transparent to-transparent" />
                        <button 
                          onClick={() => setSelectedMeal(null)}
                          className="absolute top-6 right-6 p-3 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-black/60 transition-all"
                        >
                          <Plus className="w-6 h-6 rotate-45" />
                        </button>
                      </div>

                      <div className="p-8 md:p-12 -mt-12 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                          <div>
                            <span className="px-4 py-1.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest border border-purple-500/30 mb-4 inline-block">
                              {selectedMeal.category}
                            </span>
                            <h2 className={`text-4xl md:text-5xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedMeal.mealName}</h2>
                          </div>
                          <div className="flex gap-4">
                            <div className="text-center">
                              <p className="text-3xl font-bold text-purple-500">{selectedMeal.calories}</p>
                              <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Calories</p>
                            </div>
                            <div className="w-px h-12 bg-white/10" />
                            <div className="text-center">
                              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedMeal.protein}g</p>
                              <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Protein</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                          <div className="space-y-8">
                            <div>
                              <h3 className={`text-xl font-bold mb-6 flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                <Utensils className="w-5 h-5 text-purple-500" />
                                Ingredients
                              </h3>
                              <ul className="space-y-4">
                                {selectedMeal.ingredients.map((ing: string, idx: number) => (
                                  <li key={idx} className={`flex items-center gap-4 p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-gray-50 border-black/5 text-gray-600'}`}>
                                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                                    <span className="font-medium">{ing}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-purple-500/5 border-purple-500/20' : 'bg-purple-50 border-purple-200'}`}>
                              <h3 className={`text-xl font-bold mb-4 flex items-center gap-3 ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                                <Heart className="w-5 h-5" />
                                Key Benefits
                              </h3>
                              <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {selectedMeal.benefits}
                              </p>
                            </div>
                          </div>

                          <div>
                            <h3 className={`text-xl font-bold mb-6 flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              <Play className="w-5 h-5 text-purple-500" />
                              Cooking Steps
                            </h3>
                            <div className="space-y-6">
                              {selectedMeal.cookingSteps.map((step: string, idx: number) => (
                                <div key={idx} className="flex gap-6">
                                  <div className="shrink-0 w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
                                    {idx + 1}
                                  </div>
                                  <p className={`text-lg leading-relaxed pt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {step}
                                  </p>
                                </div>
                              ))}
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={async () => {
                                if (!user) return login();
                                try {
                                  await addDoc(collection(db, 'users', user.uid, 'meals'), {
                                    userId: user.uid,
                                    foodName: selectedMeal.mealName,
                                    calories: selectedMeal.calories,
                                    protein: selectedMeal.protein,
                                    carbs: selectedMeal.carbs,
                                    fats: selectedMeal.fat,
                                    timestamp: Timestamp.now()
                                  });
                                  setSelectedMeal(null);
                                } catch (err) {
                                  handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/meals`);
                                }
                              }}
                              className="w-full mt-12 py-5 rounded-2xl bg-purple-500 text-white font-bold text-lg shadow-xl shadow-purple-500/20 hover:bg-purple-600 transition-all flex items-center justify-center gap-3"
                            >
                              <CheckCircle2 className="w-6 h-6" />
                              Log this Meal
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
              </div>
              <Footer isDark={isDark} />
            </motion.div>
          )}

          {view === 'community' && (
            <motion.div
              key="community"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 overflow-y-auto custom-scrollbar flex flex-col"
            >
              <div className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h1 className={`text-4xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>FitForm Community</h1>
                    <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Connect, share, and grow with fellow athletes</p>
                  </div>
                  <div className="flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowCreateGroup(true)}
                      className="px-6 py-3 bg-[var(--accent-cyan)] text-black font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-[var(--accent-cyan)]/20"
                    >
                      <Plus className="w-5 h-5" />
                      Create Group
                    </motion.button>
                  </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Sidebar: Groups List & Invites */}
                  <div className="space-y-8">
                    <section className={`p-6 rounded-[2.5rem] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}>
                      <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <Users className="w-5 h-5 text-[var(--accent-cyan)]" />
                        Active Groups
                      </h2>
                      
                      <div className="mb-4">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-black/10 text-gray-900'}`}>
                          <Search className="w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search groups..."
                            value={groupSearchQuery}
                            onChange={(e) => setGroupSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {groups.filter(g => g.name.toLowerCase().includes(groupSearchQuery.toLowerCase())).length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-8">No groups found. Create the first one!</p>
                        ) : (
                          groups.filter(g => g.name.toLowerCase().includes(groupSearchQuery.toLowerCase())).map((group) => (
                            <button
                              key={group.id}
                              onClick={() => setSelectedGroup(group)}
                              className={`w-full p-4 rounded-2xl border transition-all text-left group flex flex-col ${
                                selectedGroup?.id === group.id
                                  ? 'bg-[var(--accent-cyan)]/10 border-[var(--accent-cyan)]/50'
                                  : isDark ? 'bg-white/5 border-white/5 hover:border-white/20' : 'bg-gray-50 border-black/5 hover:border-black/10'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1 w-full">
                                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{group.name}</h3>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap ml-2">{group.category}</span>
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-1 mb-3">{group.description}</p>
                              <div className="flex items-center justify-between w-full mt-auto">
                                <span className="text-[10px] font-bold text-[var(--accent-cyan)]">{group.memberCount || 0} Members</span>
                                <ChevronRight className={`w-4 h-4 transition-transform ${selectedGroup?.id === group.id ? 'rotate-90 text-[var(--accent-cyan)]' : 'text-gray-600'}`} />
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </section>

                    <section className={`p-6 rounded-[2.5rem] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}>
                      <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <Share2 className="w-5 h-5 text-orange-500" />
                        Invite Friends
                      </h2>
                      <div className="space-y-4">
                        <p className="text-xs text-gray-500 mb-4">Invite friends to join FitForm and earn 500 points for each successful referral!</p>
                        <div className="flex gap-2">
                          <input 
                            type="email"
                            placeholder="Friend's email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className={`flex-1 px-4 py-2 rounded-xl text-sm border ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-black/10 text-gray-900'}`}
                          />
                          <button 
                            onClick={async () => {
                              if (!user || !inviteEmail) return;
                              try {
                                await addDoc(collection(db, 'invites'), {
                                  inviterId: user.uid,
                                  inviteeEmail: inviteEmail,
                                  status: 'pending',
                                  pointsAwarded: 500,
                                  createdAt: Timestamp.now()
                                });
                                setInviteEmail("");
                                alert("Invitation sent!");
                              } catch (err) {
                                handleFirestoreError(err, OperationType.WRITE, 'invites');
                              }
                            }}
                            className="p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="pt-4 space-y-2">
                          {invites.map((invite) => (
                            <div key={invite.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                              <span className="text-xs text-gray-400 truncate max-w-[120px]">{invite.inviteeEmail}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                                invite.status === 'accepted' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                              }`}>
                                {invite.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Main Feed: Posts */}
                  <div className="lg:col-span-2 space-y-6">
                    {selectedGroup ? (
                      <>
                        <div className={`p-8 rounded-[2.5rem] border relative overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}>
                          <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h2 className={`text-3xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedGroup.name}</h2>
                                <p className="text-gray-500">{selectedGroup.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {user?.uid === selectedGroup.createdBy && (
                                  <button
                                    onClick={async () => {
                                      if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
                                        try {
                                          await deleteDoc(doc(db, 'groups', selectedGroup.id));
                                          setSelectedGroup(null);
                                        } catch (err) {
                                          handleFirestoreError(err, OperationType.DELETE, `groups/${selectedGroup.id}`);
                                        }
                                      }
                                    }}
                                    className="p-2 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                )}
                                <button 
                                  onClick={() => setSelectedGroup(null)}
                                  className="p-2 rounded-xl hover:bg-white/5 text-gray-500"
                                >
                                  <ChevronLeft className="w-6 h-6" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Create Post */}
                            <div className={`mt-8 p-6 rounded-3xl border ${isDark ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-black/10'}`}>
                              <textarea 
                                placeholder="Share something with the group..."
                                className={`w-full bg-transparent border-none focus:ring-0 text-sm resize-none mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
                                rows={3}
                                id="post-content"
                              ></textarea>
                              <div className="flex justify-between items-center">
                                <div className="flex gap-2">
                                  <button className="p-2 rounded-lg hover:bg-white/5 text-gray-500"><Camera className="w-4 h-4" /></button>
                                  <button className="p-2 rounded-lg hover:bg-white/5 text-gray-500"><MapPin className="w-4 h-4" /></button>
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={async () => {
                                    const content = (document.getElementById('post-content') as HTMLTextAreaElement).value;
                                    if (!user || !content || !selectedGroup) return;
                                    try {
                                      await addDoc(collection(db, 'groups', selectedGroup.id, 'posts'), {
                                        groupId: selectedGroup.id,
                                        userId: user.uid,
                                        userName: user.displayName || 'Anonymous',
                                        content,
                                        createdAt: Timestamp.now(),
                                        likes: 0
                                      });
                                      (document.getElementById('post-content') as HTMLTextAreaElement).value = "";
                                    } catch (err) {
                                      handleFirestoreError(err, OperationType.WRITE, `groups/${selectedGroup.id}/posts`);
                                    }
                                  }}
                                  className="px-6 py-2 bg-[var(--accent-cyan)] text-black font-bold rounded-xl text-xs uppercase tracking-widest"
                                >
                                  Post
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Feed */}
                        <div className="space-y-6">
                          {groupPosts.length === 0 ? (
                            <div className="text-center py-20">
                              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-20" />
                              <p className="text-gray-500">No posts yet. Be the first to share!</p>
                            </div>
                          ) : (
                            groupPosts.map((post) => (
                              <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-6 rounded-[2rem] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-lg shadow-black/5'}`}
                              >
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                    {post.userName[0]}
                                  </div>
                                  <div>
                                    <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{post.userName}</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                                      {post.createdAt instanceof Timestamp ? post.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                    </p>
                                  </div>
                                </div>
                                <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{post.content}</p>
                                <div className="flex items-center gap-6 pt-4 border-t border-white/5 relative">
                                  <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[var(--accent-cyan)] transition-colors">
                                    <Heart className="w-4 h-4" />
                                    {post.likes || 0}
                                  </button>
                                  <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[var(--accent-cyan)] transition-colors">
                                    <MessageSquare className="w-4 h-4" />
                                    Reply
                                  </button>
                                  <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[var(--accent-cyan)] transition-colors">
                                    <Share2 className="w-4 h-4" />
                                    Share
                                  </button>
                                  {(user?.uid === post.userId || user?.uid === selectedGroup.createdBy) && (
                                    <button 
                                      onClick={async () => {
                                        if (confirm('Are you sure you want to delete this post?')) {
                                          try {
                                            await deleteDoc(doc(db, 'groups', selectedGroup.id, 'posts', post.id));
                                          } catch (err) {
                                            handleFirestoreError(err, OperationType.DELETE, `groups/${selectedGroup.id}/posts/${post.id}`);
                                          }
                                        }
                                      }}
                                      className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-400 transition-colors ml-auto"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-12">
                        <div className="w-24 h-24 rounded-full bg-[var(--accent-cyan)]/10 flex items-center justify-center mb-6">
                          <Users className="w-12 h-12 text-[var(--accent-cyan)]" />
                        </div>
                        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Select a Group</h2>
                        <p className="text-gray-500 max-w-md">Join a community group to start communicating with other athletes, share your progress, and stay motivated!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Create Group Modal */}
              <AnimatePresence>
                {showCreateGroup && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`w-full max-w-md p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D23] border-white/10' : 'bg-white border-black/10'}`}
                    >
                      <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Create New Group</h2>
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Group Name</label>
                          <input 
                            type="text"
                            id="group-name"
                            className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-black/10 text-gray-900'}`}
                            placeholder="e.g. Penang Hill Climbers"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Category</label>
                          <select 
                            id="group-category"
                            className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-black/10 text-gray-900'}`}
                          >
                            <option value="Climbing">Climbing</option>
                            <option value="Cycling">Cycling</option>
                            <option value="Running">Running</option>
                            <option value="Yoga">Yoga</option>
                            <option value="General">General Fitness</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Description</label>
                          <textarea 
                            id="group-desc"
                            rows={3}
                            className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-black/10 text-gray-900'}`}
                            placeholder="What is this group about?"
                          ></textarea>
                        </div>
                        <div className="flex gap-4 pt-4">
                          <button 
                            onClick={() => setShowCreateGroup(false)}
                            className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-gray-500 font-bold"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={async () => {
                              const name = (document.getElementById('group-name') as HTMLInputElement).value;
                              const category = (document.getElementById('group-category') as HTMLSelectElement).value;
                              const description = (document.getElementById('group-desc') as HTMLTextAreaElement).value;
                              if (!user || !name) return;
                              try {
                                await addDoc(collection(db, 'groups'), {
                                  name,
                                  category,
                                  description,
                                  createdBy: user.uid,
                                  createdAt: Timestamp.now(),
                                  memberCount: 1
                                });
                                setShowCreateGroup(false);
                              } catch (err) {
                                alert("Failed to create group. Please try again.");
                                handleFirestoreError(err, OperationType.WRITE, 'groups');
                              }
                            }}
                            className="flex-1 px-6 py-3 bg-[var(--accent-cyan)] text-black font-bold rounded-xl"
                          >
                            Create
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
              </div>
              <Footer isDark={isDark} />
            </motion.div>
          )}

          {view === 'live' && (
            <motion.div
              key="live"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 overflow-y-auto custom-scrollbar flex flex-col"
            >
              <div className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h1 className={`text-5xl font-display font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Live <span className="text-red-500">Engagement</span></h1>
                    <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Join real-time workout sessions and interact with athletes</p>
                  </div>
                  <div className="flex gap-4">
                    {!isLive ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowGoLiveModal(true)}
                        className="px-8 py-4 bg-red-500 text-white font-bold rounded-2xl flex items-center gap-3 shadow-xl shadow-red-500/20"
                      >
                        <Camera className="w-5 h-5" />
                        Go Live
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                          if (!activeStream) return;
                          try {
                            await setDoc(doc(db, 'livestreams', activeStream.id), { isActive: false }, { merge: true });
                            setIsLive(false);
                            setActiveStream(null);
                          } catch (err) {
                            handleFirestoreError(err, OperationType.UPDATE, `livestreams/${activeStream.id}`);
                          }
                        }}
                        className="px-8 py-4 bg-gray-800 text-white font-bold rounded-2xl flex items-center gap-3 border border-white/10"
                      >
                        <Square className="w-5 h-5" />
                        End Stream
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setView('dashboard')}
                      className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/5 text-gray-900 shadow-lg'}`}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </motion.button>
                  </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  {/* Streams List */}
                  <div className="lg:col-span-3 space-y-8">
                    {activeStream ? (
                      <div className={`relative rounded-[3rem] overflow-hidden border ${isDark ? 'bg-black border-white/10' : 'bg-gray-900 border-black/10'} aspect-video flex flex-col`}>
                        {/* Video Feed */}
                        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                          {activeStream.hostId === user?.uid ? (
                            <Webcam
                              audio={false}
                              className="absolute inset-0 w-full h-full object-cover"
                              videoConstraints={{ facingMode: "user" }}
                            />
                          ) : (
                            <img 
                              src={`https://picsum.photos/seed/${activeStream.id}/1280/720`} 
                              className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <div className="relative z-10 text-center space-y-6">
                            <div className="w-24 h-24 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto animate-pulse">
                              <Camera className="w-12 h-12 text-red-500" />
                            </div>
                            <div>
                              <h2 className="text-3xl font-bold text-white mb-2">{activeStream.title}</h2>
                              <p className="text-gray-400 uppercase tracking-widest text-xs font-bold">{activeStream.hostName} is Live</p>
                            </div>
                          </div>
                          
                          {/* Overlay Controls */}
                          <div className="absolute top-8 left-8 flex items-center gap-4">
                            <div className="px-4 py-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              Live
                            </div>
                            <div className="px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border border-white/10">
                              <Users className="w-3.5 h-3.5" />
                              {activeStream.viewerCount}
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => setActiveStream(null)}
                            className="absolute top-8 right-8 p-3 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-black/60 transition-all"
                          >
                            <Plus className="w-6 h-6 rotate-45" />
                          </button>
                        </div>

                        {/* Stream Info Bar */}
                        <div className="p-8 bg-black/40 backdrop-blur-2xl border-t border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-500 to-orange-500 flex items-center justify-center text-white font-bold">
                              {activeStream.hostName[0]}
                            </div>
                            <div>
                              <p className="text-white font-bold">{activeStream.hostName}</p>
                              <p className="text-xs text-gray-400">{activeStream.category}</p>
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <button className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10">
                              <Share2 className="w-5 h-5" />
                            </button>
                            <button className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10">
                              <Heart className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {livestreams.length > 0 ? (
                          livestreams.map(stream => (
                            <motion.div
                              key={stream.id}
                              whileHover={{ y: -5 }}
                              onClick={() => setActiveStream(stream)}
                              className={`group cursor-pointer rounded-[2.5rem] overflow-hidden border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}
                            >
                              <div className="relative aspect-video">
                                <img 
                                  src={`https://picsum.photos/seed/${stream.id}/640/360`} 
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                <div className="absolute top-4 left-4 flex gap-2">
                                  <div className="px-3 py-1 rounded-lg bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest">Live</div>
                                  <div className="px-3 py-1 rounded-lg bg-black/40 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {stream.viewerCount}
                                  </div>
                                </div>
                              </div>
                              <div className="p-6">
                                <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stream.title}</h3>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">{stream.hostName} • {stream.category}</p>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="col-span-full py-20 text-center space-y-6">
                            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                              <Camera className="w-10 h-10 text-gray-500" />
                            </div>
                            <div className="space-y-2">
                              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>No Active Streams</h3>
                              <p className="text-gray-500">Be the first to go live and inspire the community!</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Chat / Sidebar */}
                  <div className="space-y-8">
                    {activeStream ? (
                      <div className={`flex flex-col h-[600px] rounded-[2.5rem] border overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}>
                        <div className="p-6 border-b border-white/10 flex items-center gap-3">
                          <MessageSquare className="w-5 h-5 text-red-500" />
                          <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Live Chat</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                          {streamChat.map(msg => (
                            <div key={msg.id} className="space-y-1">
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{msg.userName}</p>
                              <div className={`p-3 rounded-2xl text-sm ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                                {msg.content}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-6 border-t border-white/10">
                          <div className="relative">
                            <input 
                              type="text"
                              id="chat-input"
                              placeholder="Say something..."
                              onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                  const input = e.currentTarget;
                                  const content = input.value;
                                  if (!user || !content) return;
                                  try {
                                    await addDoc(collection(db, 'livestreams', activeStream.id, 'chat'), {
                                      userId: user.uid,
                                      userName: user.displayName || 'Athlete',
                                      content,
                                      timestamp: Timestamp.now()
                                    });
                                    input.value = '';
                                  } catch (err) {
                                    handleFirestoreError(err, OperationType.WRITE, `livestreams/${activeStream.id}/chat`);
                                  }
                                }
                              }}
                              className={`w-full pl-4 pr-12 py-3 rounded-xl border ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-black/10 text-gray-900'}`}
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                              <Play className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}>
                        <h3 className={`text-xl font-display font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Top Creators</h3>
                        <div className="space-y-6">
                          {[
                            { name: 'Sarah J.', followers: '12.4k', icon: 'S' },
                            { name: 'Mike Ross', followers: '8.2k', icon: 'M' },
                            { name: 'Elena K.', followers: '15.9k', icon: 'E' },
                          ].map((creator, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                                  {creator.icon}
                                </div>
                                <div>
                                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{creator.name}</p>
                                  <p className="text-[10px] text-gray-500">{creator.followers} followers</p>
                                </div>
                              </div>
                              <button className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Follow</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Go Live Modal */}
              <AnimatePresence>
                {showGoLiveModal && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`w-full max-w-md p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D23] border-white/10' : 'bg-white border-black/10'}`}
                    >
                      <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Start Live Stream</h2>
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Stream Title</label>
                          <input 
                            type="text"
                            id="stream-title"
                            className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-black/10 text-gray-900'}`}
                            placeholder="e.g. Morning Yoga Flow"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Category</label>
                          <select 
                            id="stream-category"
                            className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-black/10 text-gray-900'}`}
                          >
                            <option value="Yoga">Yoga</option>
                            <option value="HIIT">HIIT</option>
                            <option value="Strength">Strength</option>
                            <option value="Cycling">Cycling</option>
                            <option value="Q&A">Q&A</option>
                          </select>
                        </div>
                        <div className="flex gap-4 pt-4">
                          <button 
                            onClick={() => setShowGoLiveModal(false)}
                            className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-gray-500 font-bold"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={async () => {
                              const title = (document.getElementById('stream-title') as HTMLInputElement).value;
                              const category = (document.getElementById('stream-category') as HTMLSelectElement).value;
                              if (!user || !title) return;
                              try {
                                const docRef = await addDoc(collection(db, 'livestreams'), {
                                  hostId: user.uid,
                                  hostName: user.displayName || 'Athlete',
                                  title,
                                  category,
                                  viewerCount: 1,
                                  startedAt: Timestamp.now(),
                                  isActive: true
                                });
                                setIsLive(true);
                                setActiveStream({ id: docRef.id, hostId: user.uid, hostName: user.displayName || 'Athlete', title, category, viewerCount: 1, startedAt: new Date(), isActive: true });
                                setShowGoLiveModal(false);
                              } catch (err) {
                                handleFirestoreError(err, OperationType.WRITE, 'livestreams');
                              }
                            }}
                            className="flex-1 px-6 py-3 bg-red-500 text-white font-bold rounded-xl"
                          >
                            Go Live
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
              </div>
              <Footer isDark={isDark} />
            </motion.div>
          )}

          {view === 'subscription' && (
            <motion.div
              key="subscription"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 overflow-y-auto custom-scrollbar flex flex-col"
            >
              <div className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-12">
                <header className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold uppercase tracking-widest"
                  >
                    <Crown className="w-4 h-4" />
                    FitForm Premium
                  </motion.div>
                  <h1 className={`text-4xl md:text-6xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Unlock Your <span className="text-[var(--accent-cyan)]">Full Potential</span>
                  </h1>
                  <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Get access to advanced AI analysis, personalized meal plans, and exclusive community groups.
                  </p>
                </header>

                {subscription ? (
                  <div className={`max-w-2xl mx-auto p-8 rounded-[3rem] border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'}`}>
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Active Subscription</h2>
                    <p className="text-[var(--accent-cyan)] font-bold uppercase tracking-widest text-sm mb-6">{subscription.plan} Plan</p>
                    <div className="space-y-2 mb-8">
                      <p className="text-gray-500 text-sm">Started: {subscription.startDate instanceof Timestamp ? subscription.startDate.toDate().toLocaleDateString() : 'N/A'}</p>
                      <p className="text-gray-500 text-sm">Expires: {subscription.endDate instanceof Timestamp ? subscription.endDate.toDate().toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <button className="px-8 py-3 rounded-2xl border border-red-500/20 text-red-500 font-bold hover:bg-red-500/5 transition-colors">
                      Cancel Subscription
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                      { id: '7-days', name: '7 Days Trial', price: 'RM 9.90', duration: '7 days', features: ['Basic AI Analysis', 'Community Access', 'Standard Rewards'] },
                      { id: '1-month', name: 'Monthly', price: 'RM 29.90', duration: '1 month', features: ['Advanced AI Analysis', 'Personalized Meals', 'Priority Support', 'Exclusive Rewards'], popular: true },
                      { id: '3-months', name: 'Quarterly', price: 'RM 79.90', duration: '3 months', features: ['Everything in Monthly', '10% Bonus Points', 'Custom Workout Plans'] },
                      { id: '6-months', name: 'Half-Year', price: 'RM 149.90', duration: '6 months', features: ['Everything in Quarterly', '15% Bonus Points', 'Family Sharing'] },
                      { id: '1-year', name: 'Yearly', price: 'RM 269.90', duration: '1 year', features: ['Everything in Half-Year', '25% Bonus Points', 'Personal Trainer Chat'], savings: 'Save 25%' },
                    ].map((plan) => (
                      <motion.div
                        key={plan.id}
                        whileHover={{ y: -10 }}
                        className={`p-8 rounded-[3rem] border flex flex-col relative overflow-hidden ${
                          plan.popular 
                            ? 'bg-gradient-to-b from-[var(--accent-cyan)]/10 to-transparent border-[var(--accent-cyan)]/30' 
                            : isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-xl shadow-black/5'
                        }`}
                      >
                        {plan.popular && (
                          <div className="absolute top-6 right-[-35px] rotate-45 bg-[var(--accent-cyan)] text-black text-[10px] font-bold px-10 py-1 uppercase tracking-widest">
                            Popular
                          </div>
                        )}
                        <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                          <span className={`text-4xl font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                          <span className="text-gray-500 text-sm">/ {plan.duration}</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-gray-500">
                              <CheckCircle2 className="w-4 h-4 text-[var(--accent-cyan)]" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        {plan.savings && (
                          <p className="text-xs font-bold text-green-500 mb-4 uppercase tracking-widest">{plan.savings}</p>
                        ) }
                        <button 
                          onClick={() => {
                            setSelectedPlan(plan);
                            setShowPaymentModal(true);
                          }}
                          className={`w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
                            plan.popular 
                              ? 'bg-[var(--accent-cyan)] text-black shadow-lg shadow-[var(--accent-cyan)]/20' 
                              : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                          }`}
                        >
                          Subscribe Now
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* FAQ or Features Section */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
                  {[
                    { title: 'AI Form Correction', desc: 'Real-time analysis of your workout posture with instant feedback.', icon: Scan },
                    { title: 'Personalized Nutrition', desc: 'Meal plans tailored to your fitness goals and dietary preferences.', icon: Utensils },
                    { title: 'Community Groups', desc: 'Join exclusive groups of like-minded athletes for motivation.', icon: Users },
                  ].map((feature, i) => (
                    <div key={i} className="text-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                        <feature.icon className="w-8 h-8 text-[var(--accent-cyan)]" />
                      </div>
                      <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h4>
                      <p className="text-sm text-gray-500">{feature.desc}</p>
                    </div>
                  ))}
                </section>
              </div>

              {/* Payment Modal */}
              <AnimatePresence>
                {showPaymentModal && selectedPlan && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`w-full max-w-md p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D23] border-white/10' : 'bg-white border-black/10'}`}
                    >
                      <div className="flex justify-between items-center mb-8">
                        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Checkout</h2>
                        <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 hover:text-white">
                          <Plus className="w-6 h-6 rotate-45" />
                        </button>
                      </div>

                      <div className={`p-6 rounded-3xl border mb-8 ${isDark ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-black/10'}`}>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Selected Plan</p>
                        <div className="flex justify-between items-center">
                          <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedPlan.name}</p>
                          <p className="text-[var(--accent-cyan)] font-bold">{selectedPlan.price}</p>
                        </div>
                      </div>

                      <div className="space-y-4 mb-8">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Card Number</label>
                          <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input 
                              type="text"
                              placeholder="0000 0000 0000 0000"
                              className={`w-full pl-12 pr-4 py-3 rounded-xl border ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-black/10 text-gray-900'}`}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Expiry</label>
                            <input 
                              type="text"
                              placeholder="MM/YY"
                              className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-black/10 text-gray-900'}`}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">CVC</label>
                            <input 
                              type="text"
                              placeholder="000"
                              className={`w-full px-4 py-3 rounded-xl border ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-gray-50 border-black/10 text-gray-900'}`}
                            />
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={async () => {
                          if (!user || !selectedPlan) return;
                          try {
                            const startDate = Timestamp.now();
                            let endDate = new Date();
                            if (selectedPlan.id === '7-days') endDate.setDate(endDate.getDate() + 7);
                            else if (selectedPlan.id === '1-month') endDate.setMonth(endDate.getMonth() + 1);
                            else if (selectedPlan.id === '3-months') endDate.setMonth(endDate.getMonth() + 3);
                            else if (selectedPlan.id === '6-months') endDate.setMonth(endDate.getMonth() + 6);
                            else if (selectedPlan.id === '1-year') endDate.setFullYear(endDate.getFullYear() + 1);

                            await addDoc(collection(db, 'users', user.uid, 'subscriptions'), {
                              userId: user.uid,
                              plan: selectedPlan.id,
                              startDate,
                              endDate: Timestamp.fromDate(endDate),
                              status: 'active'
                            });
                            
                            setShowPaymentModal(false);
                            alert("Subscription successful! Welcome to Premium.");
                          } catch (err) {
                            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/subscriptions`);
                          }
                        }}
                        className="w-full py-4 bg-[var(--accent-cyan)] text-black font-bold rounded-2xl shadow-xl shadow-[var(--accent-cyan)]/20 uppercase tracking-widest text-xs"
                      >
                        Confirm Payment
                      </button>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
              </div>
              <Footer isDark={isDark} />
            </motion.div>
          )}

          {view === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col bg-[#0F1115]"
            >
              {/* Header & Filters */}
              <div className="shrink-0 p-6 md:p-8 lg:p-12 border-b border-white/5 bg-black/20 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                      <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight text-white mb-2">
                        Exercise <span className="text-[var(--accent-cyan)]">Library</span>
                      </h1>
                      <p className="text-gray-400 text-sm font-medium">Explore 80+ professional workouts with AI form tracking.</p>
                    </div>
                    <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
                      <div className="relative group w-full md:w-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[var(--accent-cyan)] transition-colors" />
                        <input 
                          type="text"
                          placeholder="Search exercises..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setVisibleExercisesCount(12);
                          }}
                          className="pl-12 pr-6 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-[var(--accent-cyan)]/50 focus:bg-white/10 outline-none text-white w-full md:w-80 transition-all"
                        />
                      </div>
                      <button 
                        onClick={() => setShowPlanCreator(true)}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[var(--accent-cyan)] text-black font-bold uppercase tracking-widest text-xs hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                      >
                        <Plus className="w-4 h-4" />
                        Create Custom Plan
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Equipment</label>
                      <div className="flex p-1 rounded-xl bg-white/5 border border-white/10">
                        {(['All', 'No Equipment', 'With Equipment'] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => {
                              setEquipmentFilter(f);
                              setVisibleExercisesCount(12);
                            }}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                              equipmentFilter === f 
                                ? 'bg-[var(--accent-cyan)] text-black shadow-[0_0_15px_rgba(0,229,255,0.3)]' 
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Muscle Group</label>
                      <div className="flex flex-wrap p-1 rounded-xl bg-white/5 border border-white/10">
                        {(['All', 'Chest', 'Back', 'Legs', 'Core', 'Shoulders', 'Arms', 'Full Body'] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => {
                              setMuscleGroupFilter(f);
                              setVisibleExercisesCount(12);
                            }}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                              muscleGroupFilter === f 
                                ? 'bg-[var(--accent-cyan)] text-black shadow-[0_0_15px_rgba(0,229,255,0.3)]' 
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                <div className="flex-1 p-6 md:p-8 lg:p-12">
                  <div className="max-w-7xl mx-auto space-y-12">
                  {/* Special Outdoor Group */}
                  <section>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-2 rounded-lg bg-orange-500/20">
                        <Mountain className="w-5 h-5 text-orange-500" />
                      </div>
                      <h2 className="text-2xl font-display font-bold text-white">Special Outdoor Group</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {OUTDOOR_ACTIVITIES.map((activity) => (
                        <motion.button
                          key={activity.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedOutdoorActivity(activity);
                            setView('outdoor');
                          }}
                          className="p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/5 to-transparent hover:from-orange-500/10 transition-all text-left group relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <activity.icon className="w-32 h-32" />
                          </div>
                          <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="p-3 rounded-2xl bg-orange-500/20">
                                <activity.icon className="w-6 h-6 text-orange-500" />
                              </div>
                              <h3 className="text-xl font-display font-bold text-white">{activity.name}</h3>
                            </div>
                            <p className="text-sm text-gray-400 mb-6 max-w-sm">{activity.description}</p>
                            <div className="flex items-center gap-2 text-orange-500 font-bold uppercase tracking-widest text-[10px]">
                              Explore Routes <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-2 rounded-lg bg-[var(--accent-cyan)]/20">
                        <Dumbbell className="w-5 h-5 text-[var(--accent-cyan)]" />
                      </div>
                      <h2 className="text-2xl font-display font-bold text-white">Standard Exercises</h2>
                    </div>
                    {(() => {
                    const filtered = EXERCISES.filter(ex => {
                      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchesEquip = equipmentFilter === 'All' || ex.category === equipmentFilter;
                      const matchesMuscle = muscleGroupFilter === 'All' || ex.targetMuscle === muscleGroupFilter;
                      return matchesSearch && matchesEquip && matchesMuscle;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                            <Search className="w-10 h-10 text-gray-600" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">No exercises found</h3>
                          <p className="text-gray-500">Try adjusting your filters or search query.</p>
                        </div>
                      );
                    }

                    return (
                      <>
                        {customPlans.length > 0 && (
                          <div className="mb-12">
                            <h3 className="text-2xl font-bold text-white mb-6">Your Custom Plans</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {customPlans.map((plan, i) => (
                                <motion.div
                                  key={plan.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-gradient-to-br from-[#1E232B] to-[#121419] p-6 rounded-[2.5rem] border border-white/10 group hover:border-[var(--accent-cyan)]/50 transition-all flex flex-col justify-between"
                                >
                                  <div>
                                    <div className="flex justify-between items-start mb-4">
                                      <h4 className="text-xl font-bold text-white uppercase tracking-wider">{plan.name}</h4>
                                      <div className="px-3 py-1 rounded-full bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] text-xs font-bold">
                                        {plan.exercises.length} Exercises
                                      </div>
                                    </div>
                                    <div className="space-y-2 mb-6">
                                      {plan.exercises.slice(0, 3).map((ex: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)]/50" />
                                          <span className="truncate">{ex.name}</span>
                                        </div>
                                      ))}
                                      {plan.exercises.length > 3 && (
                                        <div className="text-xs text-gray-500 italic">+ {plan.exercises.length - 3} more</div>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setActiveCustomPlan(plan);
                                      setCustomPlanStep(0);
                                      // Start the first exercise in the plan
                                      setSelectedExercise(EXERCISES.find(e => e.name === plan.exercises[0].name) || EXERCISES[0]);
                                      setView('workout');
                                      setIsAnalyzing(true);
                                      setSessionStartTime(Date.now());
                                      setSessionAccuracies([]);
                                      setFeedback(t.startingAnalysis);
                                      setAccuracy(null);
                                      setRiskLevel(null);
                                    }}
                                    className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-xs group-hover:bg-[var(--accent-cyan)] group-hover:text-black group-hover:border-[var(--accent-cyan)] transition-all"
                                  >
                                    Start Plan
                                  </button>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {filtered.slice(0, visibleExercisesCount).map((ex) => (
                            <motion.button
                              key={ex.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              whileHover={{ y: -8 }}
                              onClick={() => {
                                setSelectedExercise(ex);
                                setShowTutorialModal(true);
                                setIsCameraActive(false);
                              }}
                              className="group relative flex flex-col bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden hover:border-[var(--accent-cyan)]/30 transition-all duration-500"
                            >
                              {/* Image Placeholder */}
                              <div className="aspect-[4/3] relative overflow-hidden bg-black/40">
                                <img 
                                  src={ex.imageUrl} 
                                  alt={ex.name}
                                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                
                                <div className="absolute top-4 right-4">
                                  <div className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border backdrop-blur-md ${
                                    ex.difficulty === 'Beginner' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                                    ex.difficulty === 'Intermediate' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' :
                                    'bg-red-500/20 border-red-500/30 text-red-400'
                                  }`}>
                                    {ex.difficulty}
                                  </div>
                                </div>
                              </div>

                              <div className="p-6 flex flex-col flex-1">
                                <div className="flex flex-wrap gap-2 mb-4">
                                  <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[8px] font-bold uppercase tracking-widest text-gray-400">
                                    {ex.targetMuscle}
                                  </span>
                                  <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[8px] font-bold uppercase tracking-widest text-gray-400">
                                    {ex.category}
                                  </span>
                                </div>
                                <h3 className="text-xl font-display font-bold text-white group-hover:text-[var(--accent-cyan)] transition-colors mb-4">{ex.name}</h3>
                                
                                <div className="mt-auto flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-[var(--accent-cyan)] opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0">
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Tutorial</span>
                                    <ChevronRight className="w-4 h-4" />
                                  </div>
                                  <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-[var(--accent-cyan)] group-hover:text-black transition-all">
                                    <Play className="w-4 h-4" />
                                  </div>
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </div>

                        {visibleExercisesCount < filtered.length && (
                          <div className="mt-16 flex justify-center">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setVisibleExercisesCount(prev => prev + 12)}
                              className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-all flex items-center gap-3"
                            >
                              <RefreshCcw className="w-4 h-4" />
                              Load More Exercises
                            </motion.button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </section>
              </div>
              </div>
              <Footer isDark={isDark} />
            </div>
          </motion.div>
          )}

          {view === 'workout' && (
            <motion.div
              key="workout"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col p-3 md:p-4 gap-3 md:gap-4"
            >
              {/* Back Button at the top */}
              <div className="shrink-0 flex items-center mb-4">
                <motion.button
                  whileHover={{ x: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBack}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl border text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 group w-fit whitespace-nowrap ${isDark ? 'text-gray-400 border-white/10 bg-white/5 hover:text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)]/30' : 'text-gray-500 border-black/10 bg-black/5 hover:text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)]/30'}`}
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  {t.backToExercises}
                </motion.button>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-8 min-h-0">
                {/* Left Column: Analysis */}
                <div className="flex-1 flex flex-col gap-4 md:gap-6 overflow-y-auto min-h-[40vh] lg:min-h-0 custom-scrollbar pr-2 order-1">
                  <div className={`shrink-0 rounded-[2.5rem] border p-6 md:p-8 flex flex-col gap-6 ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-black/5 shadow-sm'} relative overflow-hidden`}>
                    {/* Top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent-cyan)] to-transparent opacity-50" />

                    <div className="flex justify-between items-start relative z-10">
                      <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shrink-0 shadow-inner transition-transform duration-500 hover:scale-105 ${isDark ? 'bg-black/40 border-white/10' : 'bg-gray-50 border-black/5'}`}>
                          <ExerciseSymbol id={selectedExercise.id} className="w-8 h-8 text-[var(--accent-cyan)]" />
                        </div>
                        <div className="space-y-1">
                          <h2 className={`status-label opacity-50 ${isDark ? '' : 'text-gray-600'}`}>{t.activeSession}</h2>
                          <div className="text-2xl md:text-3xl font-display font-bold uppercase tracking-tight premium-gradient">{t.exercises[selectedExercise.id as keyof typeof t.exercises]?.name || selectedExercise.name}</div>
                        </div>
                      </div>
                      {accuracy !== null && (
                        <div className="text-right">
                          <div className="text-5xl font-bold text-[var(--accent-cyan)] drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]">{accuracy}%</div>
                          <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-2 font-bold">{t.accuracy}</div>
                        </div>
                      )}
                    </div>

                    <div className={`rounded-3xl p-6 md:p-8 border shadow-xl transition-all duration-500 ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/[0.08]' : 'bg-black/5 border-black/5 hover:bg-black/[0.08]'}`}>
                      <p className={`text-xl md:text-2xl leading-relaxed font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {feedback || (isAnalyzing ? t.calibrating : t.systemStandby)}
                      </p>
                      <AnimatePresence>
                        {instructions && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className={`p-4 rounded-xl border ${isDark ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] border-[var(--accent-cyan)]/20' : 'bg-cyan-50 text-cyan-700 border-cyan-200'}`}
                          >
                            <div className="flex items-start gap-3">
                              <Info className="w-5 h-5 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-bold uppercase tracking-widest mb-1 opacity-80">AI Analysis</p>
                                <p className="text-sm">{instructions}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Form Tips Widget */}
                    <div className={`rounded-3xl p-6 md:p-8 border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-black/[0.02] border-black/5'}`}>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-[var(--accent-cyan)]/10">
                          <CheckCircle2 className="w-5 h-5 text-[var(--accent-cyan)]" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">{t.formTips}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(FORM_TIPS[selectedExercise.id] || ["Maintain steady tempo", "Focus on breathing", "Keep core engaged", "Full range of motion"]).map((tip, idx) => (
                          <div key={idx} className="flex items-center gap-4 group">
                            <div className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] shadow-[0_0_10px_rgba(0,229,255,0.5)] group-hover:scale-125 transition-transform" />
                            <span className={`text-sm font-medium transition-colors ${isDark ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <AnimatePresence>
                      {showCorrectionSuccess && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -10 }}
                          className="bg-green-500/20 border border-green-500/40 p-6 rounded-3xl shadow-[0_0_30px_rgba(34,197,94,0.15)] flex items-center gap-4"
                        >
                          <div className="p-2 rounded-full bg-green-500/20">
                            <CheckCircle2 className="w-6 h-6 text-green-400" />
                          </div>
                          <span className="text-green-400 font-bold text-base uppercase tracking-widest">{t.postureCorrected}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {riskLevel && (
                      <div className="flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                          <span className={`status-label ${isDark ? '' : 'text-gray-600'}`}>{t.riskLevel}</span>
                          <span className={`font-bold uppercase tracking-[0.2em] text-xs px-6 py-2 rounded-full shadow-lg ${isDark ? 'bg-white/5' : 'bg-black/5'} ${getRiskColor(riskLevel)}`}>
                            {riskLevel}
                          </span>
                        </div>
                        
                        {warning && riskLevel !== 'Low' && (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-red-500/10 border border-red-500/30 p-6 rounded-3xl shadow-[0_0_20px_rgba(239,68,68,0.05)]"
                          >
                            <div className="flex items-center gap-3 text-red-400 mb-3">
                              <AlertCircle className="w-6 h-6" />
                              <span className="text-xs font-bold uppercase tracking-[0.2em]">{t.warning}</span>
                            </div>
                            <p className="text-base text-red-100/90 leading-relaxed font-medium">{warning}</p>
                          </motion.div>
                        )}

                        {instructions && (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30 p-6 rounded-3xl shadow-[0_0_20px_rgba(0,229,255,0.05)]"
                          >
                            <div className="flex items-center gap-3 text-[var(--accent-cyan)] mb-3">
                              <CheckCircle2 className="w-6 h-6" />
                              <span className="text-xs font-bold uppercase tracking-[0.2em]">{t.instructions}</span>
                            </div>
                            <p className={`text-base leading-relaxed font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{instructions}</p>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {lastAnalysisTime && (
                      <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                        <span className={`status-label opacity-40 ${isDark ? '' : 'text-gray-600'}`}>{t.lastSync}</span>
                        <span className="timer-display text-[var(--accent-cyan)]/60 text-[11px] font-bold">
                          {new Date(lastAnalysisTime).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Camera View */}
                <div className="flex-1 flex flex-col gap-4 md:gap-6 min-w-0 order-2 min-h-[40vh] lg:min-h-0">
                  <div className={`flex-1 overflow-hidden relative bg-black flex items-center justify-center min-h-0 rounded-[2.5rem] border shadow-2xl ${isDark ? 'border-white/10' : 'border-black/5'}`}>
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      className="w-full h-full object-cover opacity-90 grayscale-[0.2] contrast-[1.1]"
                      videoConstraints={{
                        facingMode: cameraFacingMode,
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                      }}
                      onUserMedia={() => console.log("Camera successfully opened")}
                      onUserMediaError={(err) => {
                        console.error("Camera error:", err);
                        setError("Could not access camera. Please check permissions.");
                      }}
                    />
                    <button
                      onClick={() => setCameraFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                      className="absolute top-6 right-6 p-4 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 hover:bg-black/60 transition-all z-30"
                    >
                      <RefreshCcw className="w-6 h-6" />
                    </button>
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none"
                      width={1280}
                      height={720}
                    />
                    
                    <div className="absolute inset-0 pointer-events-none border-[1px] border-white/10 rounded-[2.5rem]" />
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                    
                    {isAnalyzing && (
                      <motion.div
                        initial={{ top: '0%' }}
                        animate={{ top: '100%' }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-[2px] bg-[var(--accent-cyan)]/60 shadow-[0_0_30px_rgba(0,229,255,1)] z-10"
                      />
                    )}

                    <div className="absolute top-8 left-8 flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${isAnalyzing ? 'bg-[var(--accent-cyan)] animate-pulse shadow-[0_0_15px_rgba(0,229,255,1)]' : 'bg-white/20'}`} />
                        <span className="status-label text-white text-[10px] bg-black/60 px-4 py-2 rounded-full backdrop-blur-2xl border border-white/10 font-bold">
                          {isAnalyzing ? t.aiFormAnalysis : t.standbyMode}
                        </span>
                      </div>
                      {isAnalyzing && (
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${poseDetected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,1)]' : 'bg-red-500 animate-pulse'}`} />
                          <span className="status-label text-white text-[9px] bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-xl border border-white/5">
                            {poseDetected ? 'Body Detected' : 'Detecting Body...'}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,1)]" />
                        <span className="status-label text-white text-[9px] bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-xl border border-white/5">
                          AI Engine: Online
                        </span>
                      </div>
                      {selectedExercise.videoUrl && (
                        <button
                          onClick={() => setShowTutorial(true)}
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/80 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-purple-600 transition-all backdrop-blur-md border border-white/10"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          View Tutorial
                        </button>
                      )}
                    </div>

                    <div className="absolute bottom-8 left-8 right-8 pointer-events-auto flex gap-3">
                      {!isAnalyzing ? (
                        <motion.button
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={toggleAnalysis}
                          className="w-full flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-bold transition-all shadow-2xl text-sm tracking-[0.2em] uppercase bg-gradient-to-br from-[var(--accent-cyan)] to-blue-500 text-black shadow-[0_10px_40px_rgba(0,229,255,0.4)]"
                        >
                          <Play className="w-5 h-5 fill-current" />
                          {t.startWorkout}
                        </motion.button>
                      ) : (
                        <div className="grid grid-cols-3 gap-3 w-full">
                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={togglePause}
                            className={`flex items-center justify-center gap-2 px-4 py-4 rounded-2xl font-bold transition-all shadow-xl text-[10px] tracking-widest uppercase ${isPaused ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}
                          >
                            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                            {isPaused ? t.resume : t.pause}
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleFinish}
                            className={`flex items-center justify-center gap-2 px-4 py-4 rounded-2xl font-bold transition-all shadow-xl text-[10px] tracking-widest uppercase ${activeCustomPlan ? 'bg-[var(--accent-cyan)] text-black hover:bg-[var(--accent-cyan)]/80' : 'bg-white text-black hover:bg-gray-200'}`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {activeCustomPlan ? (
                              customPlanStep < activeCustomPlan.exercises.length - 1 ? 'Next Exercise' : 'Finish Plan'
                            ) : t.finish}
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleRestart}
                            className="flex items-center justify-center gap-2 px-4 py-4 rounded-2xl font-bold transition-all shadow-xl text-[10px] tracking-widest uppercase bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                          >
                            <RotateCcw className="w-4 h-4" />
                            {t.restart}
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Exercise Tutorial Video Modal */}
          <AnimatePresence>
            {showTutorial && selectedExercise.videoUrl && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowTutorial(false)}
                  className="absolute inset-0 bg-black/90 backdrop-blur-md"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className={`relative w-full max-w-4xl aspect-video rounded-[2.5rem] border overflow-hidden shadow-2xl ${isDark ? 'bg-[#1A1D23] border-white/10' : 'bg-white border-black/5'}`}
                >
                  <iframe
                    src={selectedExercise.videoUrl}
                    title={`${selectedExercise.name} Tutorial`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  <button
                    onClick={() => setShowTutorial(false)}
                    className="absolute top-6 right-6 p-3 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-black/60 transition-all"
                  >
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          {/* Plan Creator Modal */}
          <AnimatePresence>
            {showPlanCreator && (
              <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto w-full">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-4xl bg-[#15181E] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col my-auto"
                >
                  <div className="p-8 border-b border-white/5 flex justify-between items-center">
                    <div>
                      <h2 className="text-3xl font-display font-bold text-white">Create Custom Plan</h2>
                      <p className="text-gray-400 text-sm mt-1">Design your own workout sequence.</p>
                    </div>
                    <button 
                      onClick={() => setShowPlanCreator(false)}
                      className="p-3 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Square className="w-5 h-5 rotate-45" />
                    </button>
                  </div>
                  
                  <div className="p-8 flex flex-col md:flex-row gap-8">
                    {/* Left: Current Plan Draft */}
                    <div className="flex-1 flex flex-col gap-6 border-r border-white/5 pr-0 md:pr-8">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Plan Name</label>
                        <input 
                          type="text" 
                          value={planDraftName}
                          onChange={e => setPlanDraftName(e.target.value)}
                          placeholder="My Awesome Workout..."
                          className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-[var(--accent-cyan)]/50 focus:bg-white/10 outline-none transition-all"
                        />
                      </div>
                      
                      <div className="flex-1 overflow-y-auto max-h-[40vh] pr-2 space-y-3 custom-scrollbar">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 block">Selected Exercises</label>
                        {planDraftExercises.length === 0 ? (
                          <div className="text-center p-8 border border-dashed border-white/10 rounded-2xl text-gray-500 text-sm">
                            No exercises added yet. Select from the right.
                          </div>
                        ) : (
                          planDraftExercises.map((ex, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] flex items-center justify-center text-xs font-bold">
                                  {idx + 1}
                                </div>
                                <span className="text-white font-medium">{ex.name}</span>
                              </div>
                              <button 
                                onClick={() => setPlanDraftExercises(prev => prev.filter((_, i) => i !== idx))}
                                className="text-red-400 hover:text-red-300 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    
                    {/* Right: Exercise Library */}
                    <div className="flex-1 flex flex-col flex-1">
                      <div className="mb-4 relative">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">Available Exercises</label>
                      </div>
                      <div className="overflow-y-auto max-h-[40vh] pr-2 space-y-2 custom-scrollbar">
                        {EXERCISES.map(ex => (
                          <button
                            key={ex.id}
                            onClick={() => {
                              setPlanDraftExercises(prev => [...prev, { name: ex.name, duration: 45, guidance: `Perform ${ex.name}` }]);
                            }}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-transparent hover:border-[var(--accent-cyan)]/30 hover:bg-white/10 transition-all text-left group"
                          >
                            <span className="text-gray-300 text-sm transition-colors group-hover:text-white">{ex.name}</span>
                            <Plus className="w-4 h-4 text-gray-500 group-hover:text-[var(--accent-cyan)] transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 border-t border-white/5 flex justify-end gap-4 bg-black/20">
                    <button 
                      onClick={() => setShowPlanCreator(false)}
                      className="px-8 py-4 rounded-2xl border border-white/10 text-white hover:bg-white/5 transition-colors font-bold uppercase tracking-widest text-xs"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        if (!planDraftName || planDraftExercises.length === 0) return;
                        setCustomPlans(prev => [...prev, {
                          id: `plan_${Date.now()}`,
                          name: planDraftName,
                          exercises: planDraftExercises
                        }]);
                        setShowPlanCreator(false);
                        setPlanDraftName("");
                        setPlanDraftExercises([]);
                      }}
                      disabled={!planDraftName || planDraftExercises.length === 0}
                      className="px-8 py-4 rounded-2xl bg-[var(--accent-cyan)] text-black font-bold uppercase tracking-widest text-xs hover:bg-cyan-400 transition-colors disabled:opacity-50"
                    >
                      Save Plan
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Tutorial Modal */}
          <AnimatePresence>
            {showTutorialModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="relative w-full max-w-5xl bg-[#15181E] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl"
                >
                  <button 
                    onClick={() => setShowTutorialModal(false)}
                    className="absolute top-8 right-8 z-20 p-3 rounded-full bg-black/40 text-white hover:bg-white/10 transition-all"
                  >
                    <Square className="w-5 h-5 rotate-45" />
                  </button>

                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Media Area */}
                    <div className="aspect-video lg:aspect-auto relative bg-black">
                      {isCameraActive ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-black relative overflow-hidden">
                          <div className="absolute inset-0 opacity-20">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--accent-cyan)_0%,transparent_70%)]" />
                            <div className="grid grid-cols-8 grid-rows-8 w-full h-full border border-white/5">
                              {Array.from({ length: 64 }).map((_, i) => (
                                <div key={i} className="border-[0.5px] border-white/5" />
                              ))}
                            </div>
                          </div>
                          <Camera className="w-16 h-16 text-[var(--accent-cyan)] mb-6 animate-pulse" />
                          <h3 className="text-xl font-display font-bold text-white tracking-widest uppercase">AI Pose Tracking Active</h3>
                          <p className="text-gray-500 text-xs mt-2">Calibrating biomechanical sensors...</p>
                          
                          <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live Analysis</span>
                            </div>
                            <button 
                              onClick={() => setIsCameraActive(false)}
                              className="px-4 py-2 rounded-xl bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/20 hover:text-red-500 transition-all"
                            >
                              Stop Analysis
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full relative group">
                          <img 
                            src={selectedExercise.imageUrl} 
                            alt={selectedExercise.name}
                            className="w-full h-full object-cover opacity-40"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 rounded-full bg-[var(--accent-cyan)] flex items-center justify-center shadow-[0_0_30px_rgba(0,229,255,0.4)] group-hover:scale-110 transition-transform cursor-pointer">
                              <Play className="w-8 h-8 text-black ml-1" />
                            </div>
                          </div>
                          <div className="absolute bottom-8 left-8">
                            <span className="px-3 py-1 rounded-full bg-black/60 border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest backdrop-blur-md">
                              Tutorial Video
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content Area */}
                    <div className="p-8 md:p-12 flex flex-col h-full">
                      <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="px-3 py-1 rounded-lg bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] text-[10px] font-bold uppercase tracking-widest">
                            {selectedExercise.targetMuscle}
                          </span>
                          <span className="px-3 py-1 rounded-lg bg-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                            {selectedExercise.category}
                          </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-6 uppercase tracking-tight">{selectedExercise.name}</h2>
                        
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-3">Instructions</h4>
                            <ul className="space-y-3">
                              {[
                                "Maintain a neutral spine throughout the movement.",
                                "Engage your core to stabilize your torso.",
                                "Focus on controlled eccentric and concentric phases.",
                                "Exhale on the exertion part of the exercise."
                              ].map((step, i) => (
                                <li key={i} className="flex gap-4 text-sm text-gray-400 leading-relaxed">
                                  <span className="text-[var(--accent-cyan)] font-bold">0{i+1}</span>
                                  {step}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-8 border-t border-white/5">
                        {!isCameraActive ? (
                          <motion.button
                            whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(0,229,255,0.3)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsCameraActive(true)}
                            className="w-full py-5 rounded-2xl bg-[var(--accent-cyan)] text-black font-black uppercase tracking-widest text-sm flex items-center justify-center gap-4"
                          >
                            <Scan className="w-5 h-5" />
                            Start AI Analysis
                          </motion.button>
                        ) : (
                          <div className="flex gap-4">
                            <button 
                              onClick={() => {
                                setShowTutorialModal(false);
                                setView('workout');
                              }}
                              className="flex-1 py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm"
                            >
                              Launch Full Interface
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </AnimatePresence>
      </main>
    </div>
  );
}
