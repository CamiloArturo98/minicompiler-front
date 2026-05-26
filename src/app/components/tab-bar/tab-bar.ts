import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TabService } from '../../service/tab.service';

@Component({
  selector: 'app-tab-bar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './tab-bar.html',
})
export class TabBarComponent {

  readonly tabService = inject(TabService);

  editingId = signal<number | null>(null);
  editName  = '';

  selectTab(id: number): void {
    this.tabService.setActive(id);
  }

  newTab(): void {
    const n = this.tabService.tabs().length + 1;
    this.tabService.createTab(`file${n}.ms`).subscribe();
  }

  closeTab(id: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.tabService.tabs().length === 1) return;
    this.tabService.deleteTab(id).subscribe();
  }

  startRename(id: number, name: string, event: MouseEvent): void {
    event.stopPropagation();
    this.editingId.set(id);
    this.editName = name;
  }

  finishRename(id: number): void {
    const name = (this.editName.trim() || 'untitled.ms');
    this.tabService.renameTab(id, name.endsWith('.ms') ? name : name + '.ms');
    this.editingId.set(null);
  }

  onRenameKey(id: number, event: KeyboardEvent): void {
    if (event.key === 'Enter')  this.finishRename(id);
    if (event.key === 'Escape') this.editingId.set(null);
  }
}
