package com.companion.wakeup

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val serviceIntent = Intent(context, SpeakService::class.java)
        ContextCompat.startForegroundService(context, serviceIntent)
    }
}
