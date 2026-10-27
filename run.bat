@echo off
setlocal
cd /d "%~dp0"

if exist "%USERPROFILE%\.antigravity-ide\extensions\redhat.java-1.56.0-win32-x64\jre\21.0.12.1-win32-x86_64\bin\java.exe" (
    set "JAVA_HOME=%USERPROFILE%\.antigravity-ide\extensions\redhat.java-1.56.0-win32-x64\jre\21.0.12.1-win32-x86_64"
)

echo ==================================================
echo Starting AETHER Platform on http://localhost:8081/
echo Using JAVA_HOME: %JAVA_HOME%
echo ==================================================

call .\mvnw.cmd spring-boot:run
