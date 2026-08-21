package com.companion.wakeup

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import androidx.core.app.NotificationCompat
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class SpeakService : Service() {

    private var tts: TextToSpeech? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun onCreate() {
        super.onCreate()
        startForeground(NOTIFICATION_ID, buildNotification())
        Thread {
            val message = resolveMessage()
            mainHandler.post { speak(message) }
        }.start()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_NOT_STICKY
    }

    private fun resolveMessage(): String {
        val prefs = getSharedPreferences(AlarmScheduler.PREFS, MODE_PRIVATE)
        val systemPrompt = prefs.getString(AlarmScheduler.KEY_MESSAGE, "")?.trim() ?: ""
        if (systemPrompt.isEmpty()) return DEFAULT_MESSAGE

        val baseUrl = BuildConfig.COMPANION_API_BASE_URL
        if (baseUrl.isBlank()) return systemPrompt

        return try {
            val userName = prefs.getString(AlarmScheduler.KEY_USER_NAME, "") ?: ""
            val now = SimpleDateFormat("yyyy-MM-dd(EEE) HH:mm", Locale.JAPANESE).format(Date())
            val situation = buildString {
                append("現在時刻: ").append(now).append('\n')
                if (userName.isNotBlank()) append("呼び名: ").append(userName).append('\n')
                append("指示: ").append(systemPrompt)
            }

            val connection = URL("$baseUrl/api/companion").openConnection() as HttpURLConnection
            connection.requestMethod = "POST"
            connection.doOutput = true
            connection.connectTimeout = 8000
            connection.readTimeout = 8000
            connection.setRequestProperty("Content-Type", "application/json; charset=utf-8")
            connection.setRequestProperty("x-companion-secret", BuildConfig.COMPANION_SHARED_SECRET)

            val body = JSONObject().put("situation", situation).toString()
            connection.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }

            if (connection.responseCode in 200..299) {
                val text = connection.inputStream.bufferedReader().use { it.readText() }
                val message = JSONObject(text).optString("message", "").trim()
                message.ifEmpty { systemPrompt }
            } else {
                systemPrompt
            }
        } catch (e: Exception) {
            systemPrompt
        }
    }

    private fun speak(message: String) {
        tts = TextToSpeech(this) { status ->
            if (status != TextToSpeech.SUCCESS) {
                stopSelf()
                return@TextToSpeech
            }
            tts?.language = Locale.JAPANESE
            tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {}
                override fun onDone(utteranceId: String?) {
                    finishAndReschedule()
                }
                @Deprecated("Deprecated in Java")
                override fun onError(utteranceId: String?) {
                    finishAndReschedule()
                }
            })
            tts?.speak(message, TextToSpeech.QUEUE_FLUSH, Bundle(), "companion_wakeup")
        }
    }

    private fun finishAndReschedule() {
        val prefs = getSharedPreferences(AlarmScheduler.PREFS, MODE_PRIVATE)
        val hour = prefs.getInt(AlarmScheduler.KEY_HOUR, 7)
        val minute = prefs.getInt(AlarmScheduler.KEY_MINUTE, 30)
        if (prefs.getBoolean(AlarmScheduler.KEY_ENABLED, false)) {
            AlarmScheduler.scheduleNextTrigger(this, hour, minute)
        }
        stopSelf()
    }

    private fun buildNotification(): Notification {
        val channelId = "companion_wakeup_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(NotificationManager::class.java)
            val channel = NotificationChannel(
                channelId, "話しかけ通知", NotificationManager.IMPORTANCE_LOW
            )
            manager.createNotificationChannel(channel)
        }
        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("話しかけています")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setOngoing(true)
            .build()
    }

    override fun onDestroy() {
        tts?.stop()
        tts?.shutdown()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        private const val NOTIFICATION_ID = 1
        private const val DEFAULT_MESSAGE = "起きろー！遅刻しちゃうよ！"
    }
}
