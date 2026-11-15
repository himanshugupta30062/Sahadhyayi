import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from './drawer';

describe('Drawer UI', () => {
  it('renders drawer trigger and content components', () => {
    render(
      <Drawer open={true}>
        <DrawerTrigger asChild>
          <button>Open Drawer</button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Drawer Title</DrawerTitle>
            <DrawerDescription>Drawer Description</DrawerDescription>
          </DrawerHeader>
          <div>Main Body</div>
          <DrawerFooter>
            <DrawerClose asChild>
              <button>Close</button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );

    expect(screen.getByText('Open Drawer')).toBeInTheDocument();
    expect(screen.getByText('Drawer Title')).toBeInTheDocument();
    expect(screen.getByText('Drawer Description')).toBeInTheDocument();
    expect(screen.getByText('Main Body')).toBeInTheDocument();
  });
});
