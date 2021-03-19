REM  create a new build for QuickFolders
set /P quickFoldersRev=<revision.txt
set /a oldRev=%quickFoldersRev%
set /a quickFoldersRev+=1
REM replace previous rev with new
pwsh -Command "(gc -en UTF8NoBOM manifest.json) -replace 'pre%oldRev%', 'pre%quickFoldersRev%' | Out-File manifest.json"
"C:\Program Files\7-Zip\7z" a -xr!.svn QuickFoldersWeb.zip manifest.json _locales chrome popup license.txt *.js release-notes.html
echo %quickFoldersRev% > revision.txt
move QuickFolders*.xpi "..\..\..\Release\_Test Versions\5.4\"
pwsh -Command "Start-Sleep -m 150"
rename QuickFoldersWeb.zip QuickFolders-wx-5.4.1pre%quickFoldersRev%.xpi