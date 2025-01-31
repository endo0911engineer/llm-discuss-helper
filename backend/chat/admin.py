from django.contrib import admin
from .models import Topic

class TopicAdmin(admin.ModelAdmin):
    list_display = ('title', 'description', 'created_by', 'created_at') 
    list_filter = ('created_at', 'created_by')  
    search_fields = ('title', 'description') 
    filter_horizontal = ('participants',)  

admin.site.register(Topic)
