mod client;
mod command;
mod parser;
mod cache;
mod sync;
mod types;

use crate::command::GmailState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(GmailState::new())
        .invoke_handler(tauri::generate_handler![
            command::init_gmail_client,
            command::get_emails_rust,
            command::get_email_rust,
            command::get_mailbox_stats_rust,
            command::get_today_stats_rust, // <- zarejestrowana nowa komenda
            command::get_user_profile_rust,
            command::send_email_rust,
            command::mark_email_rust,
            command::delete_email_rust,
            command::parse_emails_batch_rust,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}