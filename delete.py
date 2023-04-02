import os

def deleteSetting (file,tempfile):
    with open(file,'r',encoding='UTF-8') as input:
        with open(tempfile, 'w', encoding='UTF-8') as output:
            for line in input:
                if ('extensions.lastAppBuildId' not in line.strip('\n')) \
                and ('extensions.lastAppVersion' not in line.strip('\n')):
                    output.write(line)
        output.close()
    input.close()
    os.replace(tempfile,file)

if __name__ == '__main__':
    file_tst = r'C:\Users\DELL\AppData\Roaming\Zotero\Zotero\Profiles\eodkcqvw.tst\prefs.js'
    file_7z = r'C:\Users\DELL\AppData\Roaming\Zotero\Zotero\Profiles\9mrx1k4s.z7\prefs.js'
    tempfile = r'C:\Users\DELL\AppData\Roaming\Zotero\Zotero\Profiles\new.js'
    deleteSetting(file_7z,tempfile)
    deleteSetting(file_tst,tempfile)
