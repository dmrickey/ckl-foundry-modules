for %%I in (.) do set currDir=%%~nxI
echo %currDir%

if "%currDir%"=="ckl-foundry-modules" (
    echo Must run from module directory
    exit
)

rd /q /s "C:\Users\David\AppData\Local\FoundryVTT\Data\modules\%currDir%" 2>nul
mklink /D "C:\Users\David\AppData\Local\FoundryVTT\Data\modules\%currDir%" C:\Users\David\Documents\repos\ckl-foundry-modules\%currDir%

rd /q /s "C:\Users\David\AppData\Local\FoundryVTT-dev\Data\modules\%currDir%" 2>nul
mklink /D "C:\Users\David\AppData\Local\FoundryVTT-dev\Data\modules\%currDir%" C:\Users\David\Documents\repos\ckl-foundry-modules\%currDir%

rd /q /s "C:\Users\David\AppData\Local\FoundryVTT-dev-v12\Data\modules\%currDir%" 2>nul
mklink /D "C:\Users\David\AppData\Local\FoundryVTT-dev-v12\Data\modules\%currDir%" C:\Users\David\Documents\repos\ckl-foundry-modules\%currDir%

@REM mklink /D "C:\Users\David\AppData\Local\FoundryVTT-dev-v12\Data\systems\pf1" C:\Users\David\Documents\repos\foundryvtt-pathdinder1-v12\dist
