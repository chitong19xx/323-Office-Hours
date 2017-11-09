How to run server

~/workspace/run.sh

How to use it:
The value updates every minute and whenever the form is submitted.
Students can see current queue length here:

http://tiny.cc/323qsize

How it works:
Google spreadsheet script counts number of students waiting in the queue.
This is the number of submissions in the "Today" spreadsheet for which the "Helped" column is empty.
It sends a GET /change/<number> request
Students read the value with Get /

Future work:
Host it somewhere else so c9 doesn't shut it down.
In the meantime, we will have to boot up this workspace every time and start up the server.
