!macro customInstall
  WriteRegStr HKCR "Directory\shell\SolarWire" "" "用 SolarWire 打开"
  WriteRegStr HKCR "Directory\shell\SolarWire" "icon" "$INSTDIR\SolarWire Editor.exe"
  WriteRegStr HKCR "Directory\shell\SolarWire\command" "" '"$INSTDIR\SolarWire Editor.exe" "%1"'
!macroend

!macro customUnInstall
  DeleteRegKey HKCR "Directory\shell\SolarWire"
!macroend
