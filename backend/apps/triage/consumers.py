import json
from channels.generic.websocket import AsyncWebsocketConsumer

class QueueConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = "triage_queue_updates"

        # Join queue group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # Send initial connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to SmartTriage real-time queue feed.'
        }))

    async def disconnect(self, close_code):
        # Leave queue group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get('action')
            if action == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
        except Exception:
            pass

    async def queue_updated(self, event):
        """Handler for queue update broadcasts."""
        await self.send(text_data=json.dumps({
            'type': 'queue_updated',
            'data': event.get('data')
        }))

    async def emergency_alert(self, event):
        """Handler for high-priority emergency alerts."""
        await self.send(text_data=json.dumps({
            'type': 'emergency_alert',
            'data': event.get('data')
        }))
