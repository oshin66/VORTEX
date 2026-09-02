import speech_recognition as sr
import webbrowser
import subprocess
import datetime
import pywhatkit
import wikipedia

import requests
  

NewsAPI = "8c605b02fadb4e3c99c4ba7a53c04f34"

# Initialize the recognizer and text-to-speech engine
# using macOS built-in 'say' command instead of pyttsx3


def speak(text: str):
    """Use macOS built-in 'say' command instead of pyttsx3"""
    subprocess.call(["say", text])



# greet function 
def greet_user():
    hour = datetime.datetime.now().hour
    if 0 <= hour < 12:
        speak("Good Morning!")
    elif 12 <= hour < 18:
        speak("Good Afternoon!")
    else:
        speak("Good Evening!")

 
#processing the command

def play_music_on_youtube(song_name):
    speak(f"Playing {song_name} on YouTube")
    pywhatkit.playonyt(song_name)

# fucntion to Quit or Exit the program

def quit_program():
    speak("Goodbye!")
    exit()

def process_command(command):
    if 'open youtube' in command.lower():
        webbrowser.open("https://www.youtube.com")
        speak("Opening YouTube")

    elif 'open google' in command.lower():
        webbrowser.open("https://www.google.com")
        speak("Opening Google")

    elif 'open stackoverflow' in command.lower():
        webbrowser.open("https://stackoverflow.com")
        speak("Opening Stack Overflow")

    elif 'what is your name' in command.lower():
        speak("My name is , your personal assistant.")

    elif 'how are you' in command.lower():
        speak("I am fine, thank you. How can I assist you today?")
    
    elif 'open instagram' in command.lower():
        webbrowser.open("https://www.instagram.com")
        speak("Opening Instagram")

    elif 'open facebook' in command.lower():
        webbrowser.open("https://www.facebook.com")
        speak("Opening Facebook")

    elif 'open twitter' in command.lower():
        webbrowser.open("https://www.x.com")
        speak("Opening Twitter")

    elif 'open linkedin' in command.lower():
        webbrowser.open("https://www.linkedin.com")
        speak("Opening LinkedIn")

    elif 'open github' in command.lower():
        webbrowser.open("https://www.github.com")
        speak("Opening GitHub")

    elif 'open gmail' in command.lower():
        webbrowser.open("https://mail.google.com")
        speak("Opening Gmail")

    

    elif 'search' in command.lower():
        query = command.lower().replace("search", "").strip()
        if query:
         
         speak(f"Searching {query} on Google")
         webbrowser.open(f"https://www.google.com/search?q={query}")

        else:
            speak("What do you want me to search?")  

    elif  'youtube' in command.lower():
        query = command.lower().replace("youtube", "").strip()

        if query:
            speak(f"Searching {query} on YouTube")
            webbrowser.open(f"https://www.youtube.com/results?search_query={query}")

        else:
         speak("What do you want me to search on YouTube?")  


    elif 'play' in command.lower():
        song = command.lower().replace("play", "").strip()

        if song:
            play_music_on_youtube(song)

        else:
            speak("Which song do you want me to play?")

    elif 'wikipedia' in command.lower():
        query = command.lower().replace("wikipedia", "").strip()

        if query:
            speak(f"Searching {query} on Wikipedia...")
            try:
                result = wikipedia.summary(query, sentences=2)
                speak(result)
                print(result)
            except wikipedia.exceptions.DisambiguationError as e:
                speak("The term is ambiguous, please be more specific.")
                print(e.options)
            except wikipedia.exceptions.PageError:
                speak("Sorry, I could not find anything on Wikipedia for that topic.")
        else:
             speak("What do you want me to search on Wikipedia?")
    
    

    elif 'news' in command.lower():
     response = requests.get(f"https://newsapi.org/v2/top-headlines?country=in&apiKey={NewsAPI}")
     if response.status_code == 200:
        data = response.json()
        articles = data.get('articles', [])

        for article in articles[:5]:
            title = article.get('title')
            description = article.get('description')
            if title:
                speak(f"Title: {title}")
                print(f"Title: {title}")
            if description:
                speak(f"Description: {description}")
                print(f"Description: {description}")
     else:
        speak("Sorry, I could not fetch the news right now.")


                

    elif 'exit' in command.lower() or 'quit' in command.lower() or 'quit' in command.lower():
        speak("Goodbye!")
        exit()
        

# function to make the assistant speak


if __name__ =="__main__":
    greet_user()
    speak("Hello. How can I help you?")

    while True:
        r = sr.Recognizer()
        try:
            # using the microphone as source for input.
            with sr.Microphone() as source:
                print("Listening...")
                audio = r.listen(source, timeout=7, phrase_time_limit=5)

            word = r.recognize_google(audio)
            print(f"user said: {word}")

            if word.lower() == "siri":
                speak("Yes, I am listening.")
             # listen for the command
                with sr.Microphone() as source:
                    print("Listening for command...")
                    r.pause_threshold = 1
                    audio = r.listen(source, timeout=10, phrase_time_limit=5)  
                    command = r.recognize_google(audio)
                    print(f"Command: {command}")

                # process the command
                    if "exit" in command.lower() or "quit" in command.lower():
                        quit_program()
                    else:
                     process_command(command)

        except sr.WaitTimeoutError:
            print("Listening timed out, please try again.")

        except sr.UnknownValueError:
            print("Sorry, I did not get that.")

        except sr.RequestError:
            print("Sorry, my speech service is down.")
