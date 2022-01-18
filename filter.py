# File to filter all 5 letter words from full word list

import re
split = re.compile(r"\w{5}")

with open("word-list-5.txt","w") as fw:
    for word in split.findall(open("word-list-all.txt","r").read()):
            fw.write(word+"\n")