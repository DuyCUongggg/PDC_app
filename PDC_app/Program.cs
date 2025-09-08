var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseDefaultFiles();   // serve index.html khi truy cập /
app.UseStaticFiles();    // cho phép tải /css, /js, /data

app.MapFallbackToFile("index.html");
app.Run();
