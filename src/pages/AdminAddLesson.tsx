import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

const BUILD_YOUR_FIRST_BOT_CONTENT = `# Build Your First Bot: Customer Service Email Automation

**Duration:** 2-3 hours (spread over 14 days)  
**Difficulty:** Beginner  
**Guarantee:** Complete this project in 14 days or get a full refund!

---

## 🎯 What You'll Build

By the end of this lesson, you'll have a **working Customer Service Email Bot** that:

- ✅ Automatically reads incoming customer emails
- ✅ Uses AI to understand the customer's intent
- ✅ Generates personalized, helpful responses
- ✅ Drafts replies for your review (or sends automatically)
- ✅ Handles common questions like order status, returns, and FAQs

**Real Business Value:** Companies using email automation see 40-60% reduction in response time and handle 3x more inquiries without additional staff.

---

## 📋 Prerequisites

Before starting, make sure you have:

1. **A Gmail account** (or Google Workspace email)
2. **An OpenAI API key** (we'll show you how to get one)
3. **A Zapier account** (free tier works fine)
4. **15-30 minutes per day** for the next 14 days

No coding experience required! We'll use no-code tools to build this bot.

---

## 🗓️ 14-Day Build Schedule

| Day | Task | Time |
|-----|------|------|
| 1-2 | Set up accounts and get API keys | 30 min |
| 3-4 | Connect Gmail to Zapier | 20 min |
| 5-6 | Create your AI prompt template | 45 min |
| 7-8 | Build the email classification system | 30 min |
| 9-10 | Set up response generation | 45 min |
| 11-12 | Test with sample emails | 30 min |
| 13-14 | Deploy and monitor | 20 min |

**Total Time:** ~4 hours over 14 days

---

## Part 1: Setting Up Your Tools (Days 1-2)

### Step 1.1: Get Your OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to **API Keys** in the left sidebar
4. Click **Create new secret key**
5. Copy and save this key securely (you won't see it again!)

> 💡 **Pro Tip:** Set a usage limit of $10/month to start. Customer service bots typically cost $0.01-0.05 per email processed.

### Step 1.2: Set Up Zapier

1. Go to [zapier.com](https://zapier.com) and create a free account
2. Verify your email
3. Complete the onboarding (you can skip the tutorial)

### Step 1.3: Prepare Your Gmail

1. In Gmail, create a label called **"Bot Processed"**
2. Create another label called **"Needs Human Review"**
3. These will help you track what the bot has handled

---

## Part 2: Connecting Gmail to Zapier (Days 3-4)

### Step 2.1: Create Your First Zap

1. In Zapier, click **Create Zap**
2. For the **Trigger**, search for "Gmail"
3. Select **New Email** as the trigger event
4. Connect your Gmail account (follow the OAuth prompts)
5. For **Label/Mailbox**, select your inbox or a specific label like "Customer Support"

### Step 2.2: Test the Trigger

1. Send a test email to yourself with subject: "Test - Order Status Question"
2. In Zapier, click **Test trigger**
3. You should see your test email appear

> ✅ **Checkpoint:** If you see your test email in Zapier, you've completed Part 2!

---

## Part 3: Creating Your AI Prompt Template (Days 5-6)

This is where the magic happens. We'll create a prompt that tells the AI how to respond to customer emails.

### Step 3.1: The Master Prompt Template

Copy this template and customize it for your business:

\`\`\`
You are a helpful customer service assistant for [YOUR COMPANY NAME]. 
Your job is to respond to customer emails professionally and helpfully.

COMPANY INFORMATION:
- We sell [YOUR PRODUCTS/SERVICES]
- Business hours: [YOUR HOURS]
- Return policy: [YOUR POLICY]
- Shipping times: [YOUR SHIPPING INFO]

RESPONSE GUIDELINES:
1. Always be friendly and professional
2. Address the customer by name if provided
3. Acknowledge their concern before providing solutions
4. Keep responses concise (under 150 words)
5. End with an offer to help further

CUSTOMER EMAIL:
Subject: {{subject}}
From: {{from_email}}
Body: {{body}}

TASK:
1. Identify the customer's main concern (order status, return request, product question, complaint, or other)
2. Write a helpful response
3. If you cannot fully resolve the issue, explain what additional information is needed

Respond in this format:
CATEGORY: [category]
CONFIDENCE: [high/medium/low]
RESPONSE:
[your drafted response]
\`\`\`

### Step 3.2: Customize for Your Business

Replace the bracketed sections with your actual business information.

---

## Part 4-7: Building & Testing

Continue following the step-by-step guide in the full lesson content...

---

## 🎉 Congratulations!

You've built your first AI-powered Customer Service Email Bot!

### What You've Accomplished:

- ✅ Connected Gmail to an AI processing pipeline
- ✅ Created a custom prompt for your business
- ✅ Built an email classification system
- ✅ Set up automated response generation
- ✅ Implemented a monitoring and review system

---

## 🏆 Claim Your Guarantee

If you've followed this guide and don't have a working bot by day 14:

1. Email support@aiintegrationcourse.com
2. Include your Zapier Zap ID
3. Describe what's not working
4. We'll either help you fix it or process your full refund

**We're committed to your success!**
`;

const AdminAddLesson: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);

  const listCourses = async () => {
    setLoading(true);
    setStatus('Fetching courses...');
    try {
      const listCoursesAndModules = httpsCallable(functions, 'listCoursesAndModulesV2');
      const result = await listCoursesAndModules();
      const data = result.data as any;
      setCourses(data.courses || []);
      setStatus('Courses fetched successfully!');
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const addLesson = async () => {
    setLoading(true);
    setStatus('Adding lesson to Firestore...');
    try {
      const addLessonToFirestore = httpsCallable(functions, 'addLessonToFirestoreV2');
      const result = await addLessonToFirestore({
        courseId: 'course_01_id',
        moduleId: 'module_01_id',
        lesson: {
          id: 'lesson_mod1_project',
          title: 'MOD 1 PROJECT: Build Your First Bot',
          order: 5.5,
          isFree: false,
          tier: 'premium',
          content: BUILD_YOUR_FIRST_BOT_CONTENT,
          videoUrl: null,
          durationMinutes: 180,
          description: 'Build a Customer Service Email Bot in 14 days - complete this project or get a full refund!',
        },
      });
      const data = result.data as any;
      setStatus(`✅ Lesson added successfully! Path: ${data.path}`);
      // Refresh course list
      await listCourses();
    } catch (err: any) {
      setStatus(`❌ Error: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin: Add Lesson to Firestore</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={listCourses}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg mr-4 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'List Courses & Modules'}
          </button>
          
          <button
            onClick={addLesson}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add "Build Your First Bot" Lesson'}
          </button>
        </div>

        {status && (
          <div className="bg-gray-800 p-4 rounded-lg mb-8">
            <h3 className="font-bold mb-2">Status:</h3>
            <p className="whitespace-pre-wrap">{status}</p>
          </div>
        )}

        {courses.length > 0 && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-bold mb-4">Courses Structure:</h3>
            {courses.map((course: any) => (
              <div key={course.id} className="mb-4">
                <h4 className="text-lg font-semibold text-cyan-400">
                  📚 {course.title || course.id}
                </h4>
                {course.modules?.map((mod: any) => (
                  <div key={mod.id} className="ml-4 mt-2">
                    <h5 className="text-md font-medium text-purple-400">
                      📁 {mod.title || mod.id} ({mod.lessonCount} lessons)
                    </h5>
                    <ul className="ml-4 mt-1 text-sm text-gray-300">
                      {mod.lessons?.map((lesson: any) => (
                        <li key={lesson.id}>
                          📄 {lesson.order}: {lesson.title || lesson.id}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-gray-400 text-sm">
          <p>This admin page allows you to:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>View all courses and modules in Firestore</li>
            <li>Add the "Build Your First Bot" lesson as MOD 1 PROJECT (order 5.5)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminAddLesson;
