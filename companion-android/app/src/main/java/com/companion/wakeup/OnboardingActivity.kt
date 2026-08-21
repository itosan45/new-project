package com.companion.wakeup

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class OnboardingActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val prefs = getSharedPreferences(AlarmScheduler.PREFS, MODE_PRIVATE)
        val existingName = prefs.getString(AlarmScheduler.KEY_USER_NAME, null)
        if (!existingName.isNullOrBlank()) {
            goToMain()
            return
        }

        setContentView(R.layout.activity_onboarding)

        val nameInput = findViewById<EditText>(R.id.nameInput)
        findViewById<Button>(R.id.startButton).setOnClickListener {
            val name = nameInput.text.toString().trim()
            if (name.isEmpty()) {
                Toast.makeText(this, "呼び名を入力してください", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            prefs.edit().putString(AlarmScheduler.KEY_USER_NAME, name).apply()
            goToMain()
        }
    }

    private fun goToMain() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}
